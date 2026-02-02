package model

// Output represents the root JSON object
type Output struct {
	Version  int        `json:"version"`
	Packages []*Package `json:"packages"`
}

// Package represents a Go package containing test files
type Package struct {
	ImportPath string  `json:"importPath"`
	Files      []*File `json:"files"`
}

// File represents a single test file
type File struct {
	Path  string      `json:"path"`
	Tests []*TestFunc `json:"tests"`
}

// TestFunc represents a TestXxx function
type TestFunc struct {
	Name  string      `json:"func"`
	Cases []*TestCase `json:"cases"`
}

// TestCase represents a single test case extracted from the code
type TestCase struct {
	Name   string `json:"name"`
	Desc   string `json:"desc,omitempty"`
	Line   int    `json:"line"`
	Col    int    `json:"col"`
	Source string `json:"source"` // table_literal, map_key, t_run_literal, dynamic_expr
}
