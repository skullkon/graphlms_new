package solution

import (
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// TestLeakyBucketSmooths: 10 конкурентных Acquire при interval=10ms
// должны завершиться не мгновенно (поток сглажен), но все обязаны вернуться.
func TestLeakyBucketSmooths(t *testing.T) {
	lb := NewLeakyBucket(10 * time.Millisecond)
	defer lb.Stop()

	const n = 10
	var done int64
	var wg sync.WaitGroup
	wg.Add(n)

	start := time.Now()
	for i := 0; i < n; i++ {
		go func() {
			defer wg.Done()
			lb.Acquire()
			atomic.AddInt64(&done, 1)
		}()
	}

	// Ждём с большим запасом по времени.
	finished := make(chan struct{})
	go func() {
		wg.Wait()
		close(finished)
	}()

	select {
	case <-finished:
	case <-time.After(10 * time.Second):
		t.Fatalf("не все Acquire вернулись: завершилось %d из %d", atomic.LoadInt64(&done), n)
	}

	elapsed := time.Since(start)

	if got := atomic.LoadInt64(&done); got != n {
		t.Fatalf("завершилось %d Acquire, ожидалось %d", got, n)
	}

	// При сглаживании 10 запросов по одному раз в 10мс не могут пройти
	// мгновенно. Нижняя граница с большим запасом.
	if elapsed < 70*time.Millisecond {
		t.Fatalf("10 Acquire заняли %v, ожидалось >=70ms (поток должен сглаживаться)", elapsed)
	}
}

// TestLeakyBucketSequential: подряд идущие Acquire разделены интервалом.
func TestLeakyBucketSequential(t *testing.T) {
	lb := NewLeakyBucket(10 * time.Millisecond)
	defer lb.Stop()

	start := time.Now()
	for i := 0; i < 5; i++ {
		lb.Acquire()
	}
	elapsed := time.Since(start)

	// 5 проходов с интервалом 10мс — заметно больше нуля.
	if elapsed < 30*time.Millisecond {
		t.Fatalf("5 последовательных Acquire заняли %v, ожидалось >=30ms", elapsed)
	}
}

// TestStopNoPanic: Stop не должен паниковать и блокировать.
func TestStopNoPanic(t *testing.T) {
	lb := NewLeakyBucket(5 * time.Millisecond)
	lb.Acquire()
	lb.Stop()
	// Дать время фоновой горутине завершиться.
	time.Sleep(20 * time.Millisecond)
}

// Idle time must not accumulate two immediately available permits.
func TestLeakyBucketSpacingAfterIdle(t *testing.T) {
	const interval = 80 * time.Millisecond
	lb := NewLeakyBucket(interval)
	defer lb.Stop()
	time.Sleep(3 * interval)
	lb.Acquire()
	begin := time.Now()
	lb.Acquire()
	if elapsed := time.Since(begin); elapsed < interval*3/4 {
		t.Fatalf("permits after idle were only %v apart, need interval %v", elapsed, interval)
	}
}
