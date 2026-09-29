package jobs

import (
	"context"
	"errors"
	"net/http"
	"time"
)

// Result — результат обработки текста.
type Result struct {
	Text  string `json:"text"`
	Words int    `json:"words"`
}

// Analyze нужно реализовать на первом этапе.
func Analyze(text string) Result {
	// TODO: удалить пробелы по краям, перевести текст в верхний регистр,
	// посчитать слова через strings.Fields.
	return Result{}
}

// ErrRetryable обозначает временную ошибку, при которой допустима новая попытка.
var ErrRetryable = errors.New("temporary processing failure")

type Config struct {
	Workers     int
	QueueSize   int
	DataFile    string
	MaxAttempts int
	RetryDelay  time.Duration
	Process     func(context.Context, string) (Result, error)
}

// App объединяет HTTP API, очередь, обработчики и состояние заданий.
// Поля и внутреннее устройство выберите самостоятельно.
type App struct{}

func New(config Config) (*App, error) {
	// TODO: этапы 2–6. Нулевые настройки означают значения по умолчанию.
	return &App{}, nil
}

func (app *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// TODO: реализуйте контракт HTTP из второго этапа.
	http.Error(w, "Учебная заготовка: реализуйте текущий этап", http.StatusNotImplemented)
}

func (app *App) Shutdown(ctx context.Context) error {
	// TODO: прекратить приём, дождаться работ, при дедлайне отменить ожидания.
	return nil
}
