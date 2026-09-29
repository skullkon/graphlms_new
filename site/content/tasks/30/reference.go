package solution

import (
	"sync"
	"time"
)

// Pool stops admitting work and waits for running jobs within a deadline.
// Job.Run is cooperative: a timeout cannot forcibly stop an arbitrary function.
type Pool struct {
	tasks    <-chan Job
	workers  int
	done     chan struct{}
	changed  chan struct{}
	mu       sync.Mutex
	stopped  bool
	started  bool
	alive    int
	inFlight map[int]struct{}
}

func NewPool(workers int, tasks <-chan Job) *Pool {
	if workers < 1 {
		workers = 1
	}
	return &Pool{tasks: tasks, workers: workers, done: make(chan struct{}), changed: make(chan struct{}, 1), inFlight: make(map[int]struct{})}
}

func (p *Pool) Start() {
	p.mu.Lock()
	if p.started || p.stopped {
		p.mu.Unlock()
		return
	}
	p.started = true
	p.alive = p.workers
	p.mu.Unlock()
	for i := 0; i < p.workers; i++ {
		go p.worker()
	}
}

func (p *Pool) notify() {
	select {
	case p.changed <- struct{}{}:
	default:
	}
}

func (p *Pool) worker() {
	defer func() {
		p.mu.Lock()
		p.alive--
		p.mu.Unlock()
		p.notify()
	}()
	for {
		select {
		case <-p.done:
			return
		case job, ok := <-p.tasks:
			if !ok {
				return
			}
			p.mu.Lock()
			// Stop and admission share the lock: no new registration after Stop.
			if p.stopped {
				p.mu.Unlock()
				return
			}
			p.inFlight[job.ID] = struct{}{}
			p.mu.Unlock()
			if job.Run != nil {
				job.Run()
			}
			p.mu.Lock()
			delete(p.inFlight, job.ID)
			p.mu.Unlock()
			p.notify()
		}
	}
}

func (p *Pool) Stop(timeout time.Duration) []int {
	p.mu.Lock()
	if !p.stopped {
		p.stopped = true
		close(p.done)
	}
	p.mu.Unlock()
	timer := time.NewTimer(timeout)
	defer timer.Stop()
	for {
		p.mu.Lock()
		finished := p.alive == 0
		p.mu.Unlock()
		if finished {
			break
		}
		select {
		case <-p.changed:
			continue
		case <-timer.C:
			return p.unfinished()
		}
	}
	return p.unfinished()
}

func (p *Pool) unfinished() []int {
	p.mu.Lock()
	defer p.mu.Unlock()
	ids := make([]int, 0, len(p.inFlight))
	for id := range p.inFlight {
		ids = append(ids, id)
	}
	return ids
}
