package example

import (
	"testing"
)

func TestPatternA(t *testing.T) {
	tests := []struct {
		name string
		val  int
	}{
		{name: "case1", val: 1},
		{name: "case2", val: 2},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.val == 0 {
				t.Error("fail")
			}
		})
	}
}

func TestPatternB(t *testing.T) {
	tests := map[string]struct {
		val int
	}{
		"mapCase1": {val: 1},
		"mapCase2": {val: 2},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			_ = tt
		})
	}
}

func TestPatternC(t *testing.T) {
	t.Run("literalCase", func(t *testing.T) {
		// logic
	})
}

func TestPatternMixed(t *testing.T) {
	// Pattern A with different field name "desc"
	tests := []struct {
		desc string
		in   string
	}{
		{desc: "desc1", in: "a"},
	}
	for _, tc := range tests {
		t.Run(tc.desc, func(t *testing.T) {})
	}
}

func TestPatternImplicitField(t *testing.T) {
	// Just standard fields, t.Run uses "tt.name" but struct uses "Name"
	tests := []struct {
		Name string
	}{
		{Name: "Implicit1"},
	}
	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {})
	}
}

func TestPatternVarDecl(t *testing.T) {
	var tests = []struct {
		name string
	}{
		{name: "varDeclCase"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {})
	}
}

func TestPatternUnkeyed(t *testing.T) {
	// Unkeyed struct literal
	tests := []struct {
		name string
		val  int
	}{
		{"unkeyedCase1", 1},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {})
	}
}
