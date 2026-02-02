package parser

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"strings"

	"go-testlist-cli/internal/model"
)

// ParseDir recursively parses directories for Go test files
func ParseDir(root string) (*model.Output, error) {
	out := &model.Output{
		Version:  1,
		Packages: []*model.Package{},
	}

	// Map to aggregate files by package import path (approximated by directory path)
	// Key: importPath (relative dir path), Value: *model.Package
	pkgMap := make(map[string]*model.Package)
	var parseErrors []string

	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			// Skip excluded directories
			name := info.Name()
			if name == ".git" || name == "vendor" || name == "node_modules" || name == "dist" || name == "build" {
				return filepath.SkipDir
			}
			return nil
		}

		if !strings.HasSuffix(info.Name(), "_test.go") {
			return nil
		}

		// Parse the file
		fset := token.NewFileSet()
		f, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
		if err != nil {
			// Report error to stderr as per requirements, but continue processing other files
			errMsg := fmt.Sprintf("Failed to parse %s: %v", path, err)
			fmt.Fprintln(os.Stderr, errMsg)
			parseErrors = append(parseErrors, errMsg)
			return nil
		}

		// Extract tests
		var testFuncs []*model.TestFunc
		for _, decl := range f.Decls {
			if fn, ok := decl.(*ast.FuncDecl); ok {
				if strings.HasPrefix(fn.Name.Name, "Test") && len(fn.Type.Params.List) > 0 {
					// Minimal check for Test signature func(t *testing.T)
					// We just check prefix "Test" for MVP
					cases := extractTestCases(fset, fn)

					// Add even if no cases found (so we see the test function exists)
					testFuncs = append(testFuncs, &model.TestFunc{
						Name:  fn.Name.Name,
						Cases: cases,
					})
				}
			}
		}

		if len(testFuncs) > 0 {
			// Determine package grouping
			// We use the directory path relative to root as the import path key
			// or the declared package name if simple.
			// The requirement says "importPath": "example.com/foo".
			// Without go.mod analysis, full import path is hard.
			// We will use relative directory path from execution root or the file's dir.
			dir := filepath.Dir(path)

			pkg, ok := pkgMap[dir]
			if !ok {
				pkg = &model.Package{
					ImportPath: dir, // Approximation
					Files:      []*model.File{},
				}
				pkgMap[dir] = pkg
				out.Packages = append(out.Packages, pkg)
			}

			pkg.Files = append(pkg.Files, &model.File{
				Path:  path,
				Tests: testFuncs,
			})
		}

		return nil
	})

	if err == nil && len(parseErrors) > 0 {
		err = fmt.Errorf("encountered %d parsing error(s)", len(parseErrors))
	}

	return out, err
}
