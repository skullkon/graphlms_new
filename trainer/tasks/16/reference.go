package solution

import (
	"sync"
	"time"
)

// RateLimiter — ограничитель частоты по алгоритму token bucket.
//
// Бакет вмещает до rps токенов и пополняется со скоростью rps в секунду.
// Каждый разрешённый Allow() тратит один токен.
type RateLimiter struct {
	mu       sync.Mutex
	rps      int
	tokens   float64
	lastFill time.Time
	now      func() time.Time
}

// NewRateLimiter создаёт лимитер на rps разрешений в секунду.
func NewRateLimiter(rps int) *RateLimiter {
	return &RateLimiter{
		rps:      rps,
		tokens:   float64(rps),
		lastFill: time.Now(),
		now:      time.Now,
	}
}

// Allow возвращает true, если операция укладывается в лимит.
// Метод не блокирует.
func (rl *RateLimiter) Allow() bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := rl.now()
	// Пополнение: за прошедшее время добавляем rps токенов в секунду,
	// но не превышаем ёмкость бакета.
	elapsed := now.Sub(rl.lastFill)
	if elapsed > 0 {
		rl.tokens += float64(rl.rps) * elapsed.Seconds()
		if rl.tokens > float64(rl.rps) {
			rl.tokens = float64(rl.rps)
		}
		rl.lastFill = now
	}

	if rl.tokens >= 1 {
		rl.tokens--
		return true
	}
	return false
}
