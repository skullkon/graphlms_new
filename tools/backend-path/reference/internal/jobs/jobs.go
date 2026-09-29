package jobs

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Result struct {
	Text  string `json:"text"`
	Words int    `json:"words"`
}

func Analyze(text string) Result {
	text = strings.TrimSpace(text)
	return Result{Text: strings.ToUpper(text), Words: len(strings.Fields(text))}
}

var ErrRetryable = errors.New("temporary processing failure")

type Config struct {
	Workers     int
	QueueSize   int
	DataFile    string
	MaxAttempts int
	RetryDelay  time.Duration
	Process     func(context.Context, string) (Result, error)
}

type job struct {
	ID       string `json:"id"`
	Text     string `json:"text"`
	Status   string `json:"status"`
	Result   Result `json:"result"`
	Attempts int    `json:"attempts"`
	Error    string `json:"error"`
}
type snapshot struct {
	Version  int               `json:"version"`
	Jobs     map[string]job    `json:"jobs"`
	Keys     map[string]string `json:"keys"`
	Original map[string]string `json:"original"`
	Retries  int               `json:"retries"`
}
type App struct {
	mu           sync.Mutex
	config       Config
	state        snapshot
	nextID       uint64
	queue        chan string
	recovered    []string
	stopped      bool
	storageError error
	workerCtx    context.Context
	cancel       context.CancelFunc
	finished     chan struct{}
}

func New(config Config) (*App, error) {
	if config.Workers < 0 || config.QueueSize < 0 || config.MaxAttempts < 0 || config.RetryDelay < 0 {
		return nil, errors.New("negative configuration")
	}
	if config.Workers == 0 {
		config.Workers = 2
	}
	if config.QueueSize == 0 {
		config.QueueSize = 16
	}
	if config.MaxAttempts == 0 {
		config.MaxAttempts = 3
	}
	if config.RetryDelay == 0 {
		config.RetryDelay = 10 * time.Millisecond
	}
	if config.Process == nil {
		config.Process = func(ctx context.Context, text string) (Result, error) {
			if err := ctx.Err(); err != nil {
				return Result{}, err
			}
			return Analyze(text), nil
		}
	}
	ctx, cancel := context.WithCancel(context.Background())
	app := &App{
		config: config, queue: make(chan string, config.QueueSize),
		workerCtx: ctx, cancel: cancel, finished: make(chan struct{}),
		state: snapshot{
			Version: 1, Jobs: make(map[string]job),
			Keys: make(map[string]string), Original: make(map[string]string),
		},
	}
	if err := app.restore(); err != nil {
		cancel()
		return nil, err
	}
	// A finite replay backlog avoids blocking New on a full queue or Process.
	var workers sync.WaitGroup
	workers.Add(config.Workers)
	for i := 0; i < config.Workers; i++ {
		go func() {
			defer workers.Done()
			app.worker()
		}()
	}
	go func() {
		workers.Wait()
		cancel()
		close(app.finished)
	}()
	return app, nil
}

func (app *App) restore() error {
	if app.config.DataFile == "" {
		return nil
	}
	data, err := os.ReadFile(app.config.DataFile)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	// Decode into zero state so omitted fields cannot inherit valid defaults.
	var restored snapshot
	if err = json.Unmarshal(data, &restored); err != nil {
		return fmt.Errorf("read snapshot: %w", err)
	}
	app.state = restored
	if app.state.Version != 1 || app.state.Jobs == nil || app.state.Keys == nil || app.state.Original == nil || app.state.Retries < 0 {
		return errors.New("invalid snapshot")
	}
	for id, j := range app.state.Jobs {
		original, exists := app.state.Original[id]
		n, err := strconv.ParseUint(id, 10, 64)
		if err != nil || n == 0 || j.ID != id || !exists || strings.TrimSpace(original) != j.Text || j.Text == "" || len(j.Text) > 4096 || j.Attempts < 0 || j.Result.Words < 0 {
			return errors.New("invalid snapshot job")
		}
		if n > app.nextID {
			app.nextID = n
		}
		switch j.Status {
		case "done":
		case "failed":
			if j.Error == "" {
				return errors.New("failed snapshot job has no error")
			}
		case "queued", "running":
			j.Status = "queued"
			j.Error = ""
			app.state.Jobs[id] = j
			app.recovered = append(app.recovered, id)
		default:
			return errors.New("invalid snapshot status")
		}
	}
	for key, id := range app.state.Keys {
		if key == "" || len(key) > 128 {
			return errors.New("invalid snapshot key")
		}
		if _, ok := app.state.Jobs[id]; !ok {
			return errors.New("snapshot key refers to missing job")
		}
	}
	sort.Slice(app.recovered, func(i, j int) bool {
		a, _ := strconv.ParseUint(app.recovered[i], 10, 64)
		b, _ := strconv.ParseUint(app.recovered[j], 10, 64)
		return a < b
	})
	if len(app.recovered) > 0 {
		return app.persist()
	}
	return nil
}

// Caller owns mu. Rename replaces a whole snapshot, not a cross-process transaction.
func (app *App) persist() (err error) {
	if app.config.DataFile == "" {
		return nil
	}
	defer func() {
		if err != nil {
			app.storageError = err
		}
	}()
	file, err := os.CreateTemp(filepath.Dir(app.config.DataFile), ".jobs-*.tmp")
	if err != nil {
		return err
	}
	name := file.Name()
	defer os.Remove(name)
	if err = json.NewEncoder(file).Encode(app.state); err != nil {
		_ = file.Close()
		return err
	}
	if err = file.Close(); err != nil {
		return err
	}
	return os.Rename(name, app.config.DataFile)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func (app *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.Method == http.MethodPost && r.URL.Path == "/jobs":
		app.submit(w, r)
	case r.Method == http.MethodGet && strings.HasPrefix(r.URL.Path, "/jobs/"):
		app.mu.Lock()
		j, ok := app.state.Jobs[strings.TrimPrefix(r.URL.Path, "/jobs/")]
		app.mu.Unlock()
		if !ok {
			http.NotFound(w, r)
			return
		}
		writeJSON(w, 200, j)
	case r.Method == http.MethodGet && r.URL.Path == "/healthz":
		app.mu.Lock()
		healthy := !app.stopped && app.storageError == nil
		app.mu.Unlock()
		if !healthy {
			http.Error(w, "not ready", 503)
			return
		}
		writeJSON(w, 200, map[string]string{"status": "ok"})
	case r.Method == http.MethodGet && r.URL.Path == "/metrics":
		app.mu.Lock()
		m := map[string]int{"workers": app.config.Workers, "capacity": cap(app.queue), "queued": 0, "running": 0, "done": 0, "failed": 0, "retries": app.state.Retries}
		for _, j := range app.state.Jobs {
			m[j.Status]++
		}
		app.mu.Unlock()
		writeJSON(w, 200, m)
	default:
		http.NotFound(w, r)
	}
}
func (app *App) submit(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 64*1024)
	defer r.Body.Close()
	var input struct {
		Text string `json:"text"`
	}
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&input); err != nil {
		http.Error(w, "invalid JSON", 400)
		return
	}
	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		http.Error(w, "one JSON object required", 400)
		return
	}
	text := strings.TrimSpace(input.Text)
	key := r.Header.Get("Idempotency-Key")
	if text == "" || len(text) > 4096 || len(key) > 128 {
		http.Error(w, "invalid text or key", 400)
		return
	}
	j, status := app.admit(text, input.Text, key)
	if status != 202 {
		http.Error(w, http.StatusText(status), status)
		return
	}
	writeJSON(w, status, j)
}
func (app *App) admit(text, original, key string) (job, int) {
	app.mu.Lock()
	defer app.mu.Unlock()
	if app.stopped || app.storageError != nil {
		return job{}, 503
	}
	if key != "" {
		if id, ok := app.state.Keys[key]; ok {
			if app.state.Original[id] != original {
				return job{}, 409
			}
			return app.state.Jobs[id], 202
		}
	}
	if len(app.queue)+len(app.recovered) >= cap(app.queue) {
		return job{}, 429
	}
	app.nextID++
	id := strconv.FormatUint(app.nextID, 10)
	j := job{ID: id, Text: text, Status: "queued"}
	app.state.Jobs[id] = j
	app.state.Original[id] = original
	if key != "" {
		app.state.Keys[key] = id
	}
	if err := app.persist(); err != nil {
		delete(app.state.Jobs, id)
		delete(app.state.Original, id)
		if key != "" {
			delete(app.state.Keys, key)
		}
		return job{}, 503
	}
	// Only this lock's owner sends or closes; capacity was checked above.
	app.queue <- id
	return j, 202
}
func (app *App) worker() {
	for {
		if app.workerCtx.Err() != nil {
			return
		}
		app.mu.Lock()
		var id string
		if len(app.recovered) > 0 {
			id = app.recovered[0]
			app.recovered = app.recovered[1:]
		}
		app.mu.Unlock()
		if id == "" {
			select {
			case <-app.workerCtx.Done():
				return
			case next, ok := <-app.queue:
				if !ok {
					return
				}
				id = next
			}
		}
		app.process(id)
	}
}
func (app *App) process(id string) {
	for attempt := 1; attempt <= app.config.MaxAttempts; attempt++ {
		app.mu.Lock()
		j := app.state.Jobs[id]
		if app.workerCtx.Err() != nil {
			j.Status = "queued"
			j.Error = ""
			app.state.Jobs[id] = j
			_ = app.persist()
			app.mu.Unlock()
			return
		}
		j.Status = "running"
		j.Error = ""
		j.Attempts++
		if attempt > 1 {
			app.state.Retries++
		}
		app.state.Jobs[id] = j
		_ = app.persist()
		app.mu.Unlock()
		result, err := app.config.Process(app.workerCtx, j.Text)
		app.mu.Lock()
		j = app.state.Jobs[id]
		retry := false
		switch {
		case err == nil:
			j.Status = "done"
			j.Result = result
			j.Error = ""
		case app.workerCtx.Err() != nil:
			j.Status = "queued"
			j.Error = ""
		case errors.Is(err, ErrRetryable) && attempt < app.config.MaxAttempts:
			retry = true
			j.Error = err.Error()
		default:
			j.Status = "failed"
			j.Error = err.Error()
		}
		app.state.Jobs[id] = j
		_ = app.persist()
		app.mu.Unlock()
		if !retry {
			return
		}
		timer := time.NewTimer(app.config.RetryDelay)
		select {
		case <-timer.C:
		case <-app.workerCtx.Done():
			timer.Stop()
			app.mu.Lock()
			j = app.state.Jobs[id]
			j.Status = "queued"
			j.Error = ""
			app.state.Jobs[id] = j
			_ = app.persist()
			app.mu.Unlock()
			return
		}
	}
}
func (app *App) Shutdown(ctx context.Context) error {
	app.mu.Lock()
	if !app.stopped {
		app.stopped = true
		close(app.queue)
	}
	app.mu.Unlock()
	select {
	case <-app.finished:
		return nil
	case <-ctx.Done():
		app.cancel()
		return ctx.Err()
	}
}
