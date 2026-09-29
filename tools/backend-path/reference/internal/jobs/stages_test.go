package jobs_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"example.com/backend-path/internal/jobs"
)

// These tests deliberately use the public API, not App's implementation fields.
type observedJob struct {
	ID       string      `json:"id"`
	Text     string      `json:"text"`
	Status   string      `json:"status"`
	Result   jobs.Result `json:"result"`
	Attempts int         `json:"attempts"`
	Error    string      `json:"error"`
}

type harness struct {
	app    *jobs.App
	server *httptest.Server
	client *http.Client
}

func startApp(t *testing.T, cfg jobs.Config) *harness {
	t.Helper()
	type creation struct {
		app *jobs.App
		err error
	}
	created, abandoned := make(chan creation), make(chan struct{})
	go func() {
		app, err := jobs.New(cfg)
		select {
		case created <- creation{app, err}:
		case <-abandoned:
			if app != nil {
				ctx, cancel := context.WithTimeout(context.Background(), time.Second)
				defer cancel()
				_ = app.Shutdown(ctx)
			}
		}
	}()
	var app *jobs.App
	var err error
	select {
	case result := <-created:
		app, err = result.app, result.err
	case <-time.After(2 * time.Second):
		close(abandoned)
		t.Fatal("New blocked instead of returning a usable application")
	}
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	if app == nil {
		t.Fatal("New returned a nil App without an error")
	}
	srv := httptest.NewServer(app)
	h := &harness{app: app, server: srv, client: &http.Client{Timeout: 2 * time.Second}}
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		returned := make(chan error, 1)
		go func() { returned <- app.Shutdown(ctx) }()
		select {
		case <-returned:
		case <-time.After(3 * time.Second):
			t.Error("cleanup: Shutdown ignored its context deadline")
		}
		srv.Close()
	})
	return h
}

func (h *harness) exchange(method, path, body, key string) (int, []byte, error) {
	req, err := http.NewRequest(method, h.server.URL+path, bytes.NewBufferString(body))
	if err != nil {
		return 0, nil, err
	}
	if method == http.MethodPost {
		req.Header.Set("Content-Type", "application/json")
	}
	if key != "" {
		req.Header.Set("Idempotency-Key", key)
	}
	resp, err := h.client.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	return resp.StatusCode, b, err
}

func (h *harness) expect(t *testing.T, method, path, body, key string, want int) []byte {
	t.Helper()
	status, b, err := h.exchange(method, path, body, key)
	if err != nil {
		t.Fatalf("%s %s: %v", method, path, err)
	}
	if status != want {
		t.Fatalf("%s %s: status %d, want %d; body %s", method, path, status, want, b)
	}
	return b
}

func parseJob(t *testing.T, b []byte) observedJob {
	t.Helper()
	var j observedJob
	if err := json.Unmarshal(b, &j); err != nil {
		t.Fatalf("job is not JSON: %v; body %s", err, b)
	}
	if j.ID == "" {
		t.Fatalf("job has no ID: %s", b)
	}
	return j
}

func (h *harness) submit(t *testing.T, text, key string) observedJob {
	t.Helper()
	body, err := json.Marshal(map[string]string{"text": text})
	if err != nil {
		t.Fatal(err)
	}
	return parseJob(t, h.expect(t, "POST", "/jobs", string(body), key, http.StatusAccepted))
}

func (h *harness) awaitJob(t *testing.T, id, status string) observedJob {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		j := parseJob(t, h.expect(t, "GET", "/jobs/"+id, "", "", http.StatusOK))
		if j.Status == status {
			return j
		}
		if j.Status == "done" || j.Status == "failed" {
			t.Fatalf("job %s reached %s, want %s; error %q", id, j.Status, status, j.Error)
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatalf("job %s did not reach %s within 3 seconds", id, status)
	return observedJob{}
}

func signal(t *testing.T, ch <-chan struct{}, description string) {
	t.Helper()
	select {
	case <-ch:
	case <-time.After(2 * time.Second):
		t.Fatalf("timed out waiting for %s", description)
	}
}

func stopApp(t *testing.T, app *jobs.App) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	returned := make(chan error, 1)
	go func() { returned <- app.Shutdown(ctx) }()
	select {
	case err := <-returned:
		if err != nil {
			t.Fatalf("Shutdown: %v", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("Shutdown ignored its context deadline")
	}
}

func TestStage01Analyze(t *testing.T) {
	// Catches missing trim, uppercase, Unicode support, or Fields word counting.
	for _, tc := range []struct {
		in, text string
		words    int
	}{
		{"  hello go  ", "HELLO GO", 2},
		{"\tпривет\nмир\t", "ПРИВЕТ\nМИР", 2},
		{"one   two\tthree", "ONE   TWO\tTHREE", 3},
		{" \n\t", "", 0},
	} {
		got := jobs.Analyze(tc.in)
		if got.Text != tc.text || got.Words != tc.words {
			t.Errorf("Analyze(%q) = %+v, want Text=%q Words=%d", tc.in, got, tc.text, tc.words)
		}
	}
}

func TestStage02HTTPResultAndValidation(t *testing.T) {
	h := startApp(t, jobs.Config{})
	j := h.submit(t, "  hello go  ", "")
	if j.Status != "queued" && j.Status != "running" && j.Status != "done" {
		t.Fatalf("accepted job has invalid status %q", j.Status)
	}
	got := h.awaitJob(t, j.ID, "done")
	if got.Result.Text != "HELLO GO" || got.Result.Words != 2 {
		t.Fatalf("GET result = %+v, want HELLO GO / 2", got.Result)
	}
	h.expect(t, "GET", "/jobs/does-not-exist", "", "", http.StatusNotFound)
	for _, body := range []string{`{`, `{}`, `{"text":""}`, `{"text":" \t "}`, `{"text":7}`} {
		h.expect(t, "POST", "/jobs", body, "", http.StatusBadRequest)
	}
}

func TestStage03WorkerLimitAndQueueFull(t *testing.T) {
	started := make(chan struct{}, 8)
	release := make(chan struct{})
	var active, peak atomic.Int32
	process := func(ctx context.Context, text string) (jobs.Result, error) {
		n := active.Add(1)
		defer active.Add(-1)
		for {
			old := peak.Load()
			if n <= old || peak.CompareAndSwap(old, n) {
				break
			}
		}
		started <- struct{}{}
		select {
		case <-release:
			return jobs.Analyze(text), nil
		case <-ctx.Done():
			return jobs.Result{}, ctx.Err()
		}
	}
	// Workers=0 deliberately exercises the promised default of two workers.
	h := startApp(t, jobs.Config{QueueSize: 1, Process: process})
	a := h.submit(t, "a", "")
	signal(t, started, "first worker")
	b := h.submit(t, "b", "")
	signal(t, started, "second default worker")
	c := h.submit(t, "c", "")
	h.expect(t, "POST", "/jobs", `{"text":"overflow"}`, "", http.StatusTooManyRequests)
	if active.Load() != 2 || peak.Load() != 2 {
		t.Fatalf("running=%d peak=%d, want exactly two blocked default workers", active.Load(), peak.Load())
	}
	close(release)
	for _, id := range []string{a.ID, b.ID, c.ID} {
		h.awaitJob(t, id, "done")
	}
	if peak.Load() > 2 {
		t.Fatalf("peak %d exceeded the fixed worker limit", peak.Load())
	}
}

func TestStage03GracefulShutdownDrainsAccepted(t *testing.T) {
	started, release := make(chan struct{}, 2), make(chan struct{})
	h := startApp(t, jobs.Config{Workers: 1, QueueSize: 2, Process: func(ctx context.Context, text string) (jobs.Result, error) {
		started <- struct{}{}
		select {
		case <-release:
			return jobs.Analyze(text), nil
		case <-ctx.Done():
			return jobs.Result{}, ctx.Err()
		}
	}})
	a := h.submit(t, "first", "")
	signal(t, started, "processing before shutdown")
	b := h.submit(t, "second", "")
	finished := make(chan error, 1)
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		finished <- h.app.Shutdown(ctx)
	}()
	deadline := time.Now().Add(time.Second)
	for {
		status, _, err := h.exchange("GET", "/healthz", "", "")
		if err != nil {
			t.Fatal(err)
		}
		if status == http.StatusServiceUnavailable {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("shutdown did not stop admission")
		}
		time.Sleep(5 * time.Millisecond)
	}
	h.expect(t, "POST", "/jobs", `{"text":"new"}`, "", http.StatusServiceUnavailable)
	select {
	case err := <-finished:
		t.Fatalf("Shutdown returned before accepted work finished: %v", err)
	default:
	}
	close(release)
	select {
	case err := <-finished:
		if err != nil {
			t.Fatalf("graceful Shutdown: %v", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("Shutdown did not finish after release")
	}
	h.awaitJob(t, a.ID, "done")
	h.awaitJob(t, b.ID, "done")
}

func TestStage03ShutdownDeadlineCancelsProcessor(t *testing.T) {
	started, exited := make(chan struct{}), make(chan struct{})
	h := startApp(t, jobs.Config{Workers: 1, Process: func(ctx context.Context, _ string) (jobs.Result, error) {
		close(started)
		<-ctx.Done()
		close(exited)
		return jobs.Result{}, ctx.Err()
	}})
	h.submit(t, "blocked", "")
	signal(t, started, "blocked processor")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Millisecond)
	defer cancel()
	returned := make(chan error, 1)
	go func() { returned <- h.app.Shutdown(ctx) }()
	select {
	case err := <-returned:
		if !errors.Is(err, context.DeadlineExceeded) {
			t.Fatalf("Shutdown deadline error = %v, want DeadlineExceeded", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("Shutdown ignored its deadline")
	}
	signal(t, exited, "processor cancellation")
	h.expect(t, "GET", "/healthz", "", "", http.StatusServiceUnavailable)
}

func TestStage04PersistenceCompletedAndFailed(t *testing.T) {
	file := filepath.Join(t.TempDir(), "state.json")
	h := startApp(t, jobs.Config{DataFile: file, Process: func(_ context.Context, text string) (jobs.Result, error) {
		if text == "fail" {
			return jobs.Result{}, errors.New("permanent failure")
		}
		return jobs.Analyze(text), nil
	}})
	done := h.submit(t, "hello go", "")
	failed := h.submit(t, "fail", "")
	h.awaitJob(t, done.ID, "done")
	h.awaitJob(t, failed.ID, "failed")
	stopApp(t, h.app)
	var replayed atomic.Int32
	reopened := startApp(t, jobs.Config{DataFile: file, Process: func(_ context.Context, text string) (jobs.Result, error) {
		replayed.Add(1)
		return jobs.Analyze(text), nil
	}})
	got := reopened.awaitJob(t, done.ID, "done")
	if got.Result.Text != "HELLO GO" || got.Result.Words != 2 {
		t.Fatalf("persisted result = %+v", got.Result)
	}
	bad := reopened.awaitJob(t, failed.ID, "failed")
	if bad.Error == "" {
		t.Fatal("persisted failure lost its error")
	}
	stopApp(t, reopened.app)
	if replayed.Load() != 0 {
		t.Fatalf("terminal jobs were processed again: %d calls", replayed.Load())
	}
}

func TestStage04ReplayRunningAndQueued(t *testing.T) {
	dir := t.TempDir()
	file, snapshot := filepath.Join(dir, "state.json"), filepath.Join(dir, "recovery.json")
	started, release := make(chan struct{}, 2), make(chan struct{})
	h := startApp(t, jobs.Config{Workers: 1, QueueSize: 2, DataFile: file, Process: func(ctx context.Context, text string) (jobs.Result, error) {
		started <- struct{}{}
		select {
		case <-release:
			return jobs.Analyze(text), nil
		case <-ctx.Done():
			return jobs.Result{}, ctx.Err()
		}
	}})
	running := h.submit(t, "running work", "")
	signal(t, started, "running work")
	h.awaitJob(t, running.ID, "running")
	queued := h.submit(t, "queued work", "")
	h.awaitJob(t, queued.ID, "queued")
	backlog := h.submit(t, "backlog work", "")
	h.awaitJob(t, backlog.ID, "queued")
	data, err := os.ReadFile(file)
	if err != nil {
		t.Fatalf("accepted jobs have no snapshot: %v", err)
	}
	if !json.Valid(data) {
		t.Fatal("snapshot is not valid JSON")
	}
	if err := os.WriteFile(snapshot, data, 0600); err != nil {
		t.Fatal(err)
	}
	close(release)
	stopApp(t, h.app)
	// Reopen the exact App-produced snapshot; no knowledge of its JSON schema.
	recoveryStarted, recoveryRelease := make(chan struct{}, 3), make(chan struct{})
	recovered := startApp(t, jobs.Config{Workers: 1, QueueSize: 1, DataFile: snapshot, Process: func(ctx context.Context, text string) (jobs.Result, error) {
		recoveryStarted <- struct{}{}
		select {
		case <-recoveryRelease:
			return jobs.Analyze(text), nil
		case <-ctx.Done():
			return jobs.Result{}, ctx.Err()
		}
	}})
	// Three recovered jobs exceed worker+queue capacity (1+1). New must not
	// block waiting for the processor to finish or drop accepted recovery work.
	signal(t, recoveryStarted, "first recovered job")
	close(recoveryRelease)
	for _, tc := range []struct{ id, text string }{{running.ID, "RUNNING WORK"}, {queued.ID, "QUEUED WORK"}, {backlog.ID, "BACKLOG WORK"}} {
		got := recovered.awaitJob(t, tc.id, "done")
		if got.Result.Text != tc.text || got.Result.Words != 2 {
			t.Fatalf("replayed job %s result = %+v", tc.id, got.Result)
		}
	}
}

func TestStage04RejectCorruptSnapshot(t *testing.T) {
	file := filepath.Join(t.TempDir(), "state.json")
	if err := os.WriteFile(file, []byte(`{"broken":`), 0600); err != nil {
		t.Fatal(err)
	}
	app, err := jobs.New(jobs.Config{DataFile: file})
	if app != nil {
		stopApp(t, app)
	}
	if err == nil {
		t.Fatal("New silently accepted a corrupt JSON snapshot")
	}
}

func TestStage04SaveFailureDoesNotAccept(t *testing.T) {
	parent := filepath.Join(t.TempDir(), "storage")
	if err := os.Mkdir(parent, 0700); err != nil {
		t.Fatal(err)
	}
	h := startApp(t, jobs.Config{DataFile: filepath.Join(parent, "state.json")})
	// First prove ordinary admission works. A handler that always returns 501
	// must not pass this negative saving test on the unimplemented starter.
	accepted := h.submit(t, "can save", "")
	h.awaitJob(t, accepted.ID, "done")
	// Make saving impossible without relying on Unix permission behavior or root.
	if err := os.RemoveAll(parent); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(parent, []byte("not a directory"), 0600); err != nil {
		t.Fatal(err)
	}
	status, body, err := h.exchange("POST", "/jobs", `{"text":"cannot save"}`, "")
	if err != nil {
		t.Fatal(err)
	}
	if status < 500 || status > 599 {
		t.Fatalf("save failure returned %d, want an explicit 5xx refusal; body %s", status, body)
	}
}

func TestStage05Idempotency(t *testing.T) {
	h := startApp(t, jobs.Config{})
	a := h.submit(t, "hello go", "same-request")
	b := h.submit(t, "hello go", "same-request")
	if a.ID != b.ID {
		t.Fatalf("same key/text created two jobs: %s and %s", a.ID, b.ID)
	}
	h.expect(t, "POST", "/jobs", `{"text":"changed"}`, "same-request", http.StatusConflict)
	c := h.submit(t, "hello go", "different-request")
	if c.ID == a.ID {
		t.Fatal("different key reused an unrelated job")
	}
}

func TestStage05IdempotencySurvivesRestartAndUsesOriginalText(t *testing.T) {
	file := filepath.Join(t.TempDir(), "state.json")
	h := startApp(t, jobs.Config{DataFile: file})
	a := h.submit(t, " hello ", "saved-key")
	h.awaitJob(t, a.ID, "done")
	stopApp(t, h.app)
	reopened := startApp(t, jobs.Config{DataFile: file})
	b := reopened.submit(t, " hello ", "saved-key")
	if b.ID != a.ID {
		t.Fatalf("restart lost idempotency: old=%s new=%s", a.ID, b.ID)
	}
	reopened.expect(t, "POST", "/jobs", `{"text":"hello"}`, "saved-key", http.StatusConflict)
	c := reopened.submit(t, " hello ", "")
	if c.ID == a.ID {
		t.Fatal("a request without a key reused an earlier job")
	}
}

func TestStage05ShutdownInterruptsRetryDelay(t *testing.T) {
	first := make(chan struct{}, 8)
	var calls atomic.Int32
	h := startApp(t, jobs.Config{Workers: 1, RetryDelay: 5 * time.Second, Process: func(_ context.Context, _ string) (jobs.Result, error) {
		calls.Add(1)
		first <- struct{}{}
		return jobs.Result{}, jobs.ErrRetryable
	}})
	h.submit(t, "retry wait", "")
	signal(t, first, "first retryable error")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Millisecond)
	defer cancel()
	returned := make(chan error, 1)
	go func() { returned <- h.app.Shutdown(ctx) }()
	select {
	case err := <-returned:
		if !errors.Is(err, context.DeadlineExceeded) {
			t.Fatalf("Shutdown while waiting for retry: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("Shutdown waited for the entire retry delay")
	}
	stopApp(t, h.app)
	if got := calls.Load(); got != 1 {
		t.Fatalf("cancellation started another attempt: %d calls", got)
	}
}

func TestStage05RetryPolicy(t *testing.T) {
	for _, tc := range []struct {
		name                         string
		max, failCount, wantAttempts int
		retryable                    bool
		wantStatus                   string
	}{
		{"third_attempt_succeeds_default", 0, 2, 3, true, "done"},
		{"default_stops_at_three", 0, 10, 3, true, "failed"},
		{"configured_limit_two", 2, 10, 2, true, "failed"},
		{"permanent_error_is_not_retried", 3, 10, 1, false, "failed"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var calls atomic.Int32
			h := startApp(t, jobs.Config{MaxAttempts: tc.max, RetryDelay: time.Millisecond, Process: func(_ context.Context, text string) (jobs.Result, error) {
				if int(calls.Add(1)) <= tc.failCount {
					if tc.retryable {
						return jobs.Result{}, fmt.Errorf("temporary: %w", jobs.ErrRetryable)
					}
					return jobs.Result{}, errors.New("permanent")
				}
				return jobs.Analyze(text), nil
			}})
			j := h.submit(t, "hello go", "")
			got := h.awaitJob(t, j.ID, tc.wantStatus)
			if got.Attempts != tc.wantAttempts || int(calls.Load()) != tc.wantAttempts {
				t.Fatalf("attempts field=%d process calls=%d, want %d", got.Attempts, calls.Load(), tc.wantAttempts)
			}
			if tc.wantStatus == "failed" && got.Error == "" {
				t.Fatal("failed job has no error")
			}
			if tc.wantStatus == "done" && (got.Result.Text != "HELLO GO" || got.Result.Words != 2) {
				t.Fatalf("retry success result = %+v", got.Result)
			}
		})
	}
}

func (h *harness) metrics(t *testing.T) map[string]int {
	t.Helper()
	var m map[string]int
	if err := json.Unmarshal(h.expect(t, "GET", "/metrics", "", "", 200), &m); err != nil {
		t.Fatalf("metrics JSON: %v", err)
	}
	for _, k := range []string{"workers", "capacity", "queued", "running", "done", "failed", "retries"} {
		if _, ok := m[k]; !ok {
			t.Fatalf("metrics lacks %q: %v", k, m)
		}
	}
	return m
}

func TestStage06HealthAndDefaultMetrics(t *testing.T) {
	h := startApp(t, jobs.Config{})
	h.expect(t, "GET", "/healthz", "", "", 200)
	m := h.metrics(t)
	if m["workers"] != 2 || m["capacity"] != 16 {
		t.Fatalf("default worker/capacity metrics = %v, want 2/16", m)
	}
	for _, k := range []string{"queued", "running", "done", "failed", "retries"} {
		if m[k] != 0 {
			t.Fatalf("fresh %s = %d, want 0", k, m[k])
		}
	}
	j := h.submit(t, "hello go", "")
	h.awaitJob(t, j.ID, "done")
	stopApp(t, h.app)
	h.expect(t, "GET", "/healthz", "", "", 503)
	m = h.metrics(t)
	if m["done"] != 1 || m["running"] != 0 || m["queued"] != 0 || m["failed"] != 0 {
		t.Fatalf("completed metrics = %v", m)
	}
}

func TestStage06MetricsReflectQueueAndRetries(t *testing.T) {
	started, release := make(chan struct{}, 8), make(chan struct{})
	var calls atomic.Int32
	h := startApp(t, jobs.Config{Workers: 1, QueueSize: 2, RetryDelay: time.Millisecond, Process: func(ctx context.Context, text string) (jobs.Result, error) {
		if text == "retry" && calls.Add(1) <= 2 {
			return jobs.Result{}, jobs.ErrRetryable
		}
		if text == "fail" {
			return jobs.Result{}, errors.New("permanent")
		}
		started <- struct{}{}
		select {
		case <-release:
			return jobs.Analyze(text), nil
		case <-ctx.Done():
			return jobs.Result{}, ctx.Err()
		}
	}})
	a := h.submit(t, "retry", "")
	signal(t, started, "successful retry attempt")
	b := h.submit(t, "fail", "")
	m := h.metrics(t)
	if m["running"] != 1 || m["queued"] != 1 || m["retries"] != 2 {
		t.Fatalf("blocked metrics = %v, want running=1 queued=1 retries=2", m)
	}
	close(release)
	h.awaitJob(t, a.ID, "done")
	h.awaitJob(t, b.ID, "failed")
	stopApp(t, h.app)
	m = h.metrics(t)
	if m["done"] != 1 || m["failed"] != 1 || m["running"] != 0 || m["queued"] != 0 || m["retries"] != 2 {
		t.Fatalf("terminal metrics = %v", m)
	}
}

func TestStage07ParallelAdmissionAndResults(t *testing.T) {
	h := startApp(t, jobs.Config{Workers: 2, QueueSize: 128})
	type reply struct {
		status int
		body   []byte
		err    error
		text   string
	}
	replies := make(chan reply, 64)
	var wg sync.WaitGroup
	for i := 0; i < 64; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			text := fmt.Sprintf("request %d", i)
			body, _ := json.Marshal(map[string]string{"text": text})
			status, b, err := h.exchange("POST", "/jobs", string(body), fmt.Sprintf("parallel-%d", i))
			replies <- reply{status, b, err, fmt.Sprintf("REQUEST %d", i)}
		}(i)
	}
	wg.Wait()
	close(replies)
	seen := make(map[string]bool)
	for r := range replies {
		if r.err != nil || r.status != 202 {
			t.Fatalf("parallel POST: status %d error %v body %s", r.status, r.err, r.body)
		}
		j := parseJob(t, r.body)
		if seen[j.ID] {
			t.Fatalf("distinct request keys reused ID %s", j.ID)
		}
		seen[j.ID] = true
		got := h.awaitJob(t, j.ID, "done")
		if got.Result.Text != r.text || got.Result.Words != 2 {
			t.Fatalf("job %s result=%+v, want %q / 2", j.ID, got.Result, r.text)
		}
	}
	stopApp(t, h.app)
	m := h.metrics(t)
	if m["done"] != 64 || m["failed"] != 0 || m["running"] != 0 || m["queued"] != 0 {
		t.Fatalf("parallel final metrics = %v", m)
	}
}

func TestStage07ConcurrentIdempotency(t *testing.T) {
	h := startApp(t, jobs.Config{QueueSize: 64})
	type reply struct {
		status int
		body   []byte
		err    error
	}
	replies := make(chan reply, 24)
	var wg sync.WaitGroup
	for i := 0; i < 24; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			status, b, err := h.exchange("POST", "/jobs", `{"text":"same work"}`, "concurrent-key")
			replies <- reply{status, b, err}
		}()
	}
	wg.Wait()
	close(replies)
	var id string
	for r := range replies {
		if r.err != nil || r.status != 202 {
			t.Fatalf("repeated POST: status %d error %v body %s", r.status, r.err, r.body)
		}
		j := parseJob(t, r.body)
		if id == "" {
			id = j.ID
		}
		if j.ID != id {
			t.Fatalf("concurrent same key created IDs %s and %s", id, j.ID)
		}
	}
	h.awaitJob(t, id, "done")
	stopApp(t, h.app)
	if m := h.metrics(t); m["done"] != 1 {
		t.Fatalf("same-key jobs were processed more than once: %v", m)
	}
}
