package reference

import (
	"math/rand"
	"reflect"
	"sort"
	"testing"
)

func equal(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func TestLowerBoundAgainstScan(t *testing.T) {
	r := rand.New(rand.NewSource(14))
	for n := 0; n < 70; n++ {
		a := make([]int, n)
		for i := range a {
			a[i] = r.Intn(17) - 8
		}
		sort.Ints(a)
		for x := -10; x <= 10; x++ {
			want := 0
			for want < len(a) && a[want] < x {
				want++
			}
			if LowerBound(a, x) != want {
				t.Fatal(a, x, want)
			}
		}
	}
}
func TestMergeSortPreservesInputAndMultiplicity(t *testing.T) {
	r := rand.New(rand.NewSource(9))
	for n := 0; n < 100; n++ {
		a := make([]int, n)
		for i := range a {
			a[i] = r.Intn(21) - 10
		}
		original := append([]int(nil), a...)
		want := append([]int(nil), a...)
		sort.Ints(want)
		got := MergeSort(a)
		if !equal(got, want) || !equal(a, original) {
			t.Fatal(n, got, want)
		}
		if len(got) > 0 {
			got[0] = 999
			if !equal(a, original) {
				t.Fatal("shared result")
			}
		}
	}
}
func slowUnique(s string) int {
	a := []rune(s)
	best := 0
	for i := range a {
		seen := map[rune]bool{}
		for j := i; j < len(a); j++ {
			if seen[a[j]] {
				break
			}
			seen[a[j]] = true
			if j-i+1 > best {
				best = j - i + 1
			}
		}
	}
	return best
}
func TestWindowAgainstEnumeration(t *testing.T) {
	for _, s := range []string{"", "abba", "абва", "abcabcbb", "аa😀а", "e\u0301e"} {
		if LongestUnique(s) != slowUnique(s) {
			t.Fatal(s)
		}
	}
	var visit func(string, int)
	visit = func(s string, k int) {
		if LongestUnique(s) != slowUnique(s) {
			t.Fatal(s)
		}
		if k > 0 {
			for _, c := range "abc" {
				visit(s+string(c), k-1)
			}
		}
	}
	visit("", 6)
}
func TestBalanced(t *testing.T) {
	for s, want := range map[string]bool{"": true, "([{}])": true, "([)]": false, "]": false, "((": false, "word()": true} {
		if Balanced(s) != want {
			t.Fatal(s)
		}
	}
}
func TestBST(t *testing.T) {
	var n *Node
	for _, x := range []int{4, 2, 6, 1, 3, 4} {
		n = Insert(n, x)
	}
	if !equal(InOrder(n), []int{1, 2, 3, 4, 6}) {
		t.Fatal(InOrder(n))
	}
	if len(InOrder(nil)) != 0 {
		t.Fatal("empty")
	}
}
func TestTopKAgainstSorting(t *testing.T) {
	r := rand.New(rand.NewSource(3))
	for n := 0; n < 35; n++ {
		a := make([]int, n)
		for i := range a {
			a[i] = r.Intn(20) - 10
		}
		sorted := append([]int(nil), a...)
		sort.Ints(sorted)
		original := append([]int(nil), a...)
		for k := 0; k <= n; k++ {
			got, err := TopK(a, k)
			if err != nil || !equal(got, sorted[n-k:]) {
				t.Fatal(a, k, got, err)
			}
		}
		if !equal(a, original) {
			t.Fatal("mutated")
		}
	}
	if _, err := TopK(nil, 1); err == nil {
		t.Fatal("bad k")
	}
}
func TestBFSPath(t *testing.T) {
	g := [][]int{{1, 2}, {3}, {3}, {0}, {}}
	for _, c := range []struct {
		s, d, length int
		found        bool
	}{{0, 3, 3, true}, {0, 0, 1, true}, {0, 4, 0, false}} {
		p, ok, err := BFSPath(g, c.s, c.d)
		if err != nil || ok != c.found || len(p) != c.length {
			t.Fatal(p, ok, err)
		}
		if ok {
			if p[0] != c.s || p[len(p)-1] != c.d {
				t.Fatal(p)
			}
			for i := 1; i < len(p); i++ {
				found := false
				for _, v := range g[p[i-1]] {
					found = found || v == p[i]
				}
				if !found {
					t.Fatal("nonedge")
				}
			}
		}
	}
	if _, _, err := BFSPath([][]int{{9}}, 0, 0); err == nil {
		t.Fatal("invalid edge")
	}
}
func TestTopologicalConstraintsAndCycles(t *testing.T) {
	for _, g := range [][][]int{nil, {{}}, {{2}, {2}, {3}, {}}, {{1, 1}, {}, {}}} {
		order, err := Topological(g)
		if err != nil || len(order) != len(g) {
			t.Fatal(order, err)
		}
		pos := make([]int, len(g))
		seen := make([]bool, len(g))
		for i, v := range order {
			if v < 0 || v >= len(g) || seen[v] {
				t.Fatal("permutation")
			}
			seen[v] = true
			pos[v] = i
		}
		for u, edges := range g {
			for _, v := range edges {
				if pos[u] >= pos[v] {
					t.Fatal(g, order)
				}
			}
		}
	}
	for _, g := range [][][]int{{{0}}, {{1}, {0}}, {{99}}} {
		if _, err := Topological(g); err == nil {
			t.Fatal("invalid graph accepted", g)
		}
	}
}
func bellman(g [][]Edge, s int) []int64 {
	d := make([]int64, len(g))
	for i := range d {
		d[i] = Infinity
	}
	d[s] = 0
	for i := 0; i < len(g)-1; i++ {
		for u, es := range g {
			if d[u] == Infinity {
				continue
			}
			for _, e := range es {
				if x := d[u] + e.Weight; x < d[e.To] {
					d[e.To] = x
				}
			}
		}
	}
	return d
}
func TestDijkstraAgainstBellmanFord(t *testing.T) {
	r := rand.New(rand.NewSource(8))
	for n := 1; n < 20; n++ {
		g := make([][]Edge, n)
		for u := range g {
			for v := range g {
				if r.Intn(5) == 0 {
					g[u] = append(g[u], Edge{v, int64(r.Intn(20))})
				}
			}
		}
		for s := range g {
			got, err := Dijkstra(g, s)
			if err != nil || !reflect.DeepEqual(got, bellman(g, s)) {
				t.Fatal(g, s, got, err)
			}
		}
	}
}
func TestDijkstraInvalidAndOverflow(t *testing.T) {
	for _, g := range [][][]Edge{{{{0, -1}}}, {{{2, 1}}}, {{{1, Infinity}}, {}}, {{{1, Infinity - 1}}, {{2, 2}}, {}}} {
		if _, err := Dijkstra(g, 0); err == nil {
			t.Fatal("invalid range", g)
		}
	}
	g := [][]Edge{{{1, 10}, {2, 1}}, {}, {{1, 1}}}
	got, err := Dijkstra(g, 0)
	if err != nil || got[1] != 2 {
		t.Fatal(got, err)
	}
}
func coinBFS(coins []int, amount int) int {
	d := make([]int, amount+1)
	for i := range d {
		d[i] = -1
	}
	d[0] = 0
	q := []int{0}
	for head := 0; head < len(q); head++ {
		for _, c := range coins {
			x := q[head] + c
			if x <= amount && d[x] == -1 {
				d[x] = d[q[head]] + 1
				q = append(q, x)
			}
		}
	}
	return d[amount]
}
func TestCoinsAgainstBFS(t *testing.T) {
	for _, coins := range [][]int{nil, {1, 3, 4}, {2, 6}, {3, 7}, {1, 1, 2}} {
		for a := 0; a < 60; a++ {
			got, err := MinCoins(coins, a)
			if err != nil || got != coinBFS(coins, a) {
				t.Fatal(coins, a, got, err)
			}
		}
	}
	if _, err := MinCoins([]int{0}, 2); err == nil {
		t.Fatal("zero coin")
	}
}
func bruteIntervals(a []Interval) int {
	best := 0
	for mask := 0; mask < 1<<len(a); mask++ {
		subset := []Interval{}
		for i := range a {
			if mask&(1<<i) != 0 {
				subset = append(subset, a[i])
			}
		}
		sort.Slice(subset, func(i, j int) bool { return subset[i].Start < subset[j].Start })
		valid := true
		for i := 1; i < len(subset); i++ {
			if subset[i].Start < subset[i-1].End {
				valid = false
			}
		}
		if valid && len(subset) > best {
			best = len(subset)
		}
	}
	return best
}
func TestGreedyAgainstSubsetEnumeration(t *testing.T) {
	r := rand.New(rand.NewSource(11))
	for trial := 0; trial < 60; trial++ {
		a := make([]Interval, 9)
		for i := range a {
			s := r.Intn(12) - 5
			a[i] = Interval{s, s + r.Intn(5) + 1}
		}
		original := append([]Interval(nil), a...)
		got, err := MaxNonOverlapping(a)
		if err != nil || len(got) != bruteIntervals(a) || !reflect.DeepEqual(a, original) {
			t.Fatal(a, got, err)
		}
		for i := 1; i < len(got); i++ {
			if got[i].Start < got[i-1].End {
				t.Fatal(got)
			}
		}
	}
	if _, err := MaxNonOverlapping([]Interval{{1, 1}}); err == nil {
		t.Fatal("invalid interval")
	}
}
func TestDSUAgainstGraphReachability(t *testing.T) {
	const n = 12
	d, _ := NewDSU(n)
	g := make([][]int, n)
	r := rand.New(rand.NewSource(18))
	for step := 0; step < 60; step++ {
		a, b := r.Intn(n), r.Intn(n)
		_, err := d.Union(a, b)
		if err != nil {
			t.Fatal(err)
		}
		g[a] = append(g[a], b)
		g[b] = append(g[b], a)
		for x := 0; x < n; x++ {
			for y := 0; y < n; y++ {
				got, err := d.Connected(x, y)
				_, want, _ := BFSPath(g, x, y)
				if err != nil || got != want {
					t.Fatal(x, y, got, want)
				}
			}
		}
	}
	if _, err := d.Union(-1, 0); err == nil {
		t.Fatal("invalid element")
	}
	if d.Components() != 1 {
		t.Fatal(d.Components())
	}
}
