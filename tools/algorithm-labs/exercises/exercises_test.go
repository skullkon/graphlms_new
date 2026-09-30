package exercises

import "testing"

func TestLowerBound(t *testing.T) {
	for _, c := range []struct {
		a       []int
		x, want int
	}{{nil, 3, 0}, {[]int{1, 3, 3, 7}, 3, 1}, {[]int{1, 3}, 4, 2}} {
		if got := LowerBound(c.a, c.x); got != c.want {
			t.Fatalf("got %d want %d", got, c.want)
		}
	}
}
func TestTopological(t *testing.T) {
	g := [][]int{{2}, {2}, {3}, {}}
	order, err := Topological(g)
	if err != nil || len(order) != 4 {
		t.Fatal(order, err)
	}
	pos := make([]int, 4)
	seen := map[int]bool{}
	for i, v := range order {
		if v < 0 || v >= 4 || seen[v] {
			t.Fatal("invalid permutation")
		}
		seen[v] = true
		pos[v] = i
	}
	for u, es := range g {
		for _, v := range es {
			if pos[u] >= pos[v] {
				t.Fatal("violated dependency")
			}
		}
	}
	if _, err := Topological([][]int{{1}, {0}}); err == nil {
		t.Fatal("cycle accepted")
	}
}
func TestMinCoins(t *testing.T) {
	for _, c := range []struct {
		coins        []int
		amount, want int
	}{{[]int{1, 3, 4}, 6, 2}, {[]int{2}, 3, -1}, {nil, 0, 0}} {
		got, err := MinCoins(c.coins, c.amount)
		if err != nil || got != c.want {
			t.Fatal(got, err, c.want)
		}
	}
}
