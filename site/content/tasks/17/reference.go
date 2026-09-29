package solution

import "time"

// LeakyBucket — ограничитель по алгоритму leaky bucket.
//
// Внутренний цикл выдаёт разрешение через gate, затем заново отсчитывает
// interval. Простой не накапливает разрешения. Acquire ждёт разрешение.
type LeakyBucket struct {
	gate chan struct{}
	stop chan struct{}
}

// NewLeakyBucket создаёт ведро, пропускающее 1 запрос раз в interval.
func NewLeakyBucket(interval time.Duration) *LeakyBucket {
	lb := &LeakyBucket{
		gate: make(chan struct{}),
		stop: make(chan struct{}),
	}
	go lb.run(interval)
	return lb
}

func (lb *LeakyBucket) run(interval time.Duration) {
	timer := time.NewTimer(interval)
	defer timer.Stop()
	for {
		select {
		case <-lb.stop:
			return
		case <-timer.C:
			// Выпускаем одного ожидающего, если он есть.
			select {
			case lb.gate <- struct{}{}:
				timer.Reset(interval)
			case <-lb.stop:
				return
			}
		}
	}
}

// Acquire блокирует вызывающую горутину до её очереди.
func (lb *LeakyBucket) Acquire() {
	<-lb.gate
}

// Stop останавливает внутренний таймер.
func (lb *LeakyBucket) Stop() {
	close(lb.stop)
}
