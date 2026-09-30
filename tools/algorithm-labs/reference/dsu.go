package reference

import "errors"

type DSU struct {
	parent, size []int
	components   int
}

func NewDSU(n int) (*DSU, error) {
	if n < 0 {
		return nil, errors.New("negative size")
	}
	d := &DSU{parent: make([]int, n), size: make([]int, n), components: n}
	for i := 0; i < n; i++ {
		d.parent[i] = i
		d.size[i] = 1
	}
	return d, nil
}
func (d *DSU) Find(x int) (int, error) {
	if x < 0 || x >= len(d.parent) {
		return 0, errors.New("invalid element")
	}
	for d.parent[x] != x {
		d.parent[x] = d.parent[d.parent[x]]
		x = d.parent[x]
	}
	return x, nil
}
func (d *DSU) Union(a, b int) (bool, error) {
	// Validate both inputs before Find changes internal paths.
	if a < 0 || a >= len(d.parent) || b < 0 || b >= len(d.parent) {
		return false, errors.New("invalid element")
	}
	x, _ := d.Find(a)
	y, _ := d.Find(b)
	if x == y {
		return false, nil
	}
	if d.size[x] < d.size[y] {
		x, y = y, x
	}
	d.parent[y] = x
	d.size[x] += d.size[y]
	d.components--
	return true, nil
}
func (d *DSU) Connected(a, b int) (bool, error) {
	x, err := d.Find(a)
	if err != nil {
		return false, err
	}
	y, err := d.Find(b)
	if err != nil {
		return false, err
	}
	return x == y, nil
}
func (d *DSU) Components() int { return d.components }
