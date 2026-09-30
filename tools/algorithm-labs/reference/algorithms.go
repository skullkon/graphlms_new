// Package reference contains readable teaching models, not production services.
package reference

import (
	"container/heap"
	"errors"
	"sort"
)

func LowerBound(a []int, target int) int {
	lo, hi := 0, len(a)
	for lo < hi {
		mid := lo + (hi-lo)/2
		if a[mid] < target {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return lo
}

func MergeSort(a []int) []int {
	if len(a) < 2 {
		return append([]int(nil), a...)
	}
	mid := len(a) / 2
	l, r := MergeSort(a[:mid]), MergeSort(a[mid:])
	out := make([]int, 0, len(a))
	i, j := 0, 0
	for i < len(l) && j < len(r) {
		if l[i] <= r[j] {
			out = append(out, l[i])
			i++
		} else {
			out = append(out, r[j])
			j++
		}
	}
	out = append(out, l[i:]...)
	return append(out, r[j:]...)
}

// LongestUnique counts Unicode code points, not bytes or grapheme clusters.
func LongestUnique(s string) int {
	last := map[rune]int{}
	left, best := 0, 0
	for right, c := range []rune(s) {
		if prev, ok := last[c]; ok && prev >= left {
			left = prev + 1
		}
		last[c] = right
		if size := right - left + 1; size > best {
			best = size
		}
	}
	return best
}

func Balanced(s string) bool {
	stack := []rune{}
	open := map[rune]rune{')': '(', ']': '[', '}': '{'}
	for _, c := range s {
		switch c {
		case '(', '[', '{':
			stack = append(stack, c)
		case ')', ']', '}':
			if len(stack) == 0 || stack[len(stack)-1] != open[c] {
				return false
			}
			stack = stack[:len(stack)-1]
		}
	}
	return len(stack) == 0
}

type Node struct {
	Key         int
	Left, Right *Node
}

func Insert(n *Node, key int) *Node {
	if n == nil {
		return &Node{Key: key}
	}
	if key < n.Key {
		n.Left = Insert(n.Left, key)
	} else if key > n.Key {
		n.Right = Insert(n.Right, key)
	}
	return n
}
func InOrder(n *Node) []int {
	out := []int{}
	var visit func(*Node)
	visit = func(node *Node) {
		if node == nil {
			return
		}
		visit(node.Left)
		out = append(out, node.Key)
		visit(node.Right)
	}
	visit(n)
	return out
}

type intHeap []int

func (h intHeap) Len() int           { return len(h) }
func (h intHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h intHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *intHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *intHeap) Pop() any          { old := *h; x := old[len(old)-1]; *h = old[:len(old)-1]; return x }

// TopK returns the largest k values, sorted ascending, without mutating input.
func TopK(a []int, k int) ([]int, error) {
	if k < 0 || k > len(a) {
		return nil, errors.New("invalid k")
	}
	h := &intHeap{}
	for _, x := range a {
		if h.Len() < k {
			heap.Push(h, x)
		} else if k > 0 && x > (*h)[0] {
			(*h)[0] = x
			heap.Fix(h, 0)
		}
	}
	out := append([]int(nil), (*h)...)
	sort.Ints(out)
	return out, nil
}

func validateGraph(g [][]int) error {
	for _, edges := range g {
		for _, v := range edges {
			if v < 0 || v >= len(g) {
				return errors.New("invalid vertex")
			}
		}
	}
	return nil
}

// BFSPath finds a shortest path by number of edges. Neighbour order breaks ties.
func BFSPath(g [][]int, source, target int) ([]int, bool, error) {
	if err := validateGraph(g); err != nil {
		return nil, false, err
	}
	if source < 0 || source >= len(g) || target < 0 || target >= len(g) {
		return nil, false, errors.New("invalid endpoint")
	}
	parent := make([]int, len(g))
	for i := range parent {
		parent[i] = -1
	}
	parent[source] = source
	q := []int{source}
	for head := 0; head < len(q); head++ {
		v := q[head]
		if v == target {
			break
		}
		for _, w := range g[v] {
			if parent[w] == -1 {
				parent[w] = v
				q = append(q, w)
			}
		}
	}
	if parent[target] == -1 {
		return nil, false, nil
	}
	path := []int{target}
	for v := target; v != source; {
		v = parent[v]
		path = append(path, v)
	}
	for i, j := 0, len(path)-1; i < j; i, j = i+1, j-1 {
		path[i], path[j] = path[j], path[i]
	}
	return path, true, nil
}

// Topological uses iterative Kahn's algorithm. Edge u->v means u precedes v.
func Topological(g [][]int) ([]int, error) {
	if err := validateGraph(g); err != nil {
		return nil, err
	}
	degree := make([]int, len(g))
	for _, edges := range g {
		for _, v := range edges {
			degree[v]++
		}
	}
	q := []int{}
	for v, d := range degree {
		if d == 0 {
			q = append(q, v)
		}
	}
	for head := 0; head < len(q); head++ {
		for _, w := range g[q[head]] {
			degree[w]--
			if degree[w] == 0 {
				q = append(q, w)
			}
		}
	}
	if len(q) != len(g) {
		return nil, errors.New("cycle")
	}
	return q, nil
}

type Edge struct {
	To     int
	Weight int64
}
type state struct {
	vertex   int
	distance int64
}
type minQueue []state

func (q minQueue) Len() int           { return len(q) }
func (q minQueue) Less(i, j int) bool { return q[i].distance < q[j].distance }
func (q minQueue) Swap(i, j int)      { q[i], q[j] = q[j], q[i] }
func (q *minQueue) Push(x any)        { *q = append(*q, x.(state)) }
func (q *minQueue) Pop() any          { old := *q; x := old[len(old)-1]; *q = old[:len(old)-1]; return x }

const Infinity int64 = 1<<63 - 1

// Dijkstra requires nonnegative weights and finite sums strictly below Infinity.
func Dijkstra(g [][]Edge, source int) ([]int64, error) {
	if source < 0 || source >= len(g) {
		return nil, errors.New("invalid source")
	}
	for _, edges := range g {
		for _, e := range edges {
			if e.To < 0 || e.To >= len(g) || e.Weight < 0 {
				return nil, errors.New("invalid edge")
			}
		}
	}
	d := make([]int64, len(g))
	for i := range d {
		d[i] = Infinity
	}
	d[source] = 0
	q := &minQueue{{source, 0}}
	heap.Init(q)
	for q.Len() > 0 {
		cur := heap.Pop(q).(state)
		if cur.distance != d[cur.vertex] {
			continue
		}
		for _, e := range g[cur.vertex] {
			if e.Weight >= Infinity-cur.distance {
				return nil, errors.New("distance outside supported range")
			}
			next := cur.distance + e.Weight
			if next < d[e.To] {
				d[e.To] = next
				heap.Push(q, state{e.To, next})
			}
		}
	}
	return d, nil
}

// MinCoins finds a minimum count for an unlimited supply of positive denominations.
func MinCoins(coins []int, amount int) (int, error) {
	if amount < 0 || amount > 1000000 {
		return 0, errors.New("amount outside teaching limit")
	}
	for _, c := range coins {
		if c <= 0 {
			return 0, errors.New("nonpositive coin")
		}
	}
	dp := make([]int, amount+1)
	for a := 1; a <= amount; a++ {
		dp[a] = amount + 1
		for _, c := range coins {
			if c <= a && dp[a-c]+1 < dp[a] {
				dp[a] = dp[a-c] + 1
			}
		}
	}
	if dp[amount] > amount {
		return -1, nil
	}
	return dp[amount], nil
}

type Interval struct{ Start, End int }

// MaxNonOverlapping treats intervals as half-open [Start,End).
func MaxNonOverlapping(a []Interval) ([]Interval, error) {
	x := append([]Interval(nil), a...)
	for _, v := range x {
		if v.Start >= v.End {
			return nil, errors.New("empty or inverted interval")
		}
	}
	sort.Slice(x, func(i, j int) bool {
		if x[i].End != x[j].End {
			return x[i].End < x[j].End
		}
		return x[i].Start < x[j].Start
	})
	out := []Interval{}
	for _, v := range x {
		if len(out) == 0 || v.Start >= out[len(out)-1].End {
			out = append(out, v)
		}
	}
	return out, nil
}
