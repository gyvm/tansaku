package parser

import (
	"go/ast"
	"go/token"
	"strconv"
	"strings"

	"go-testlist-cli/internal/model"
)

// extractTestCases inspects a TestXxx function and finds test cases
func extractTestCases(fset *token.FileSet, fn *ast.FuncDecl) []*model.TestCase {
	var cases []*model.TestCase

	// We need to track variable definitions to resolve tables
	// Map variable name -> CompositeLit (the table definition)
	// This is a simplified scope tracking: we assume unique names within the function or last assignment wins
	tables := make(map[string]*ast.CompositeLit)

	ast.Inspect(fn.Body, func(n ast.Node) bool {
		switch node := n.(type) {
		case *ast.AssignStmt:
			// Track assignments: tests := ...
			// We only care if RHS is a CompositeLit (slice or map literal)
			if len(node.Lhs) == 1 && len(node.Rhs) == 1 {
				if ident, ok := node.Lhs[0].(*ast.Ident); ok {
					if lit, ok := node.Rhs[0].(*ast.CompositeLit); ok {
						tables[ident.Name] = lit
					}
				}
			}

		case *ast.DeclStmt:
			// Track variable declarations: var tests = ...
			if gen, ok := node.Decl.(*ast.GenDecl); ok && gen.Tok == token.VAR {
				for _, spec := range gen.Specs {
					if vs, ok := spec.(*ast.ValueSpec); ok {
						// var tests = []struct{...}{...}
						if len(vs.Names) == 1 && len(vs.Values) == 1 {
							if lit, ok := vs.Values[0].(*ast.CompositeLit); ok {
								tables[vs.Names[0].Name] = lit
							}
						}
					}
				}
			}

		case *ast.RangeStmt:
			// Check if this range loop runs subtests
			// Pattern A: for _, tt := range tests { t.Run(tt.name, ...) }
			// Pattern B: for name, tt := range tests { t.Run(name, ...) }

			// 1. Identify the range variable (X)
			rangeVarName := ""
			if ident, ok := node.X.(*ast.Ident); ok {
				rangeVarName = ident.Name
			}

			if rangeVarName == "" {
				return true
			}

			// 2. Look for table definition
			tableLit, ok := tables[rangeVarName]
			if !ok {
				// Table definition not found (maybe defined outside or passed in), skip
				return true
			}

			// 3. Inspect body for t.Run
			isTableTest := false
			var valueVarName string // "tt"
			var keyVarName string   // "name" (for map)

			if valIdent, ok := node.Value.(*ast.Ident); ok {
				valueVarName = valIdent.Name
			}
			if keyIdent, ok := node.Key.(*ast.Ident); ok {
				keyVarName = keyIdent.Name
			}

			fieldAccess := "" // If using tt.name
			useMapKey := false

			ast.Inspect(node.Body, func(child ast.Node) bool {
				if call, ok := child.(*ast.CallExpr); ok {
					if isTRun(call) {
						// Check first argument
						if len(call.Args) > 0 {
							arg := call.Args[0]

							// Pattern A: t.Run(tt.name, ...)
							if sel, ok := arg.(*ast.SelectorExpr); ok {
								if xIdent, ok := sel.X.(*ast.Ident); ok && xIdent.Name == valueVarName {
									fieldAccess = sel.Sel.Name
									isTableTest = true
									return false // Stop searching
								}
							}

							// Pattern B: t.Run(name, ...) where name is key
							if ident, ok := arg.(*ast.Ident); ok {
								if ident.Name == keyVarName {
									useMapKey = true
									isTableTest = true
									return false
								}
							}
						}
					}
				}
				return true
			})

			if isTableTest {
				// Extract cases from the table literal based on what we found
				newCases := extractFromTable(fset, tableLit, fieldAccess, useMapKey)
				cases = append(cases, newCases...)
			}

		case *ast.CallExpr:
			// Pattern C: t.Run("literal", ...)
			if isTRun(node) {
				if len(node.Args) > 0 {
					if lit, ok := node.Args[0].(*ast.BasicLit); ok && lit.Kind == token.STRING {
						name, _ := unquote(lit.Value)
						cases = append(cases, &model.TestCase{
							Name:   name,
							Line:   fset.Position(node.Pos()).Line,
							Col:    fset.Position(node.Pos()).Column,
							Source: "t_run_literal",
						})
					}
				}
			}
		}
		return true
	})

	return cases
}

func isTRun(call *ast.CallExpr) bool {
	if sel, ok := call.Fun.(*ast.SelectorExpr); ok {
		// We loosely check for X ending in "t" (func(t *testing.T)) and Sel.Name == "Run"
		// A stricter check would track the type of 't', but loose check is usually fine for this tool.
		if sel.Sel.Name == "Run" {
			// Check if receiver is likely 't' or subtest variable
			if ident, ok := sel.X.(*ast.Ident); ok {
				// Usually 't' or 'subT'
				// We accept any receiver name for MVP flexibility
				_ = ident
				return true
			}
		}
	}
	return false
}

func extractFromTable(fset *token.FileSet, lit *ast.CompositeLit, fieldName string, useMapKey bool) []*model.TestCase {
	var cases []*model.TestCase

	// Check if slice or map
	isMap := false
	if _, ok := lit.Type.(*ast.MapType); ok {
		isMap = true
	} else if len(lit.Elts) > 0 {
		// Infer from elements if type is implicit (e.g. nested composite lit)
		if _, ok := lit.Elts[0].(*ast.KeyValueExpr); ok {
			// Could be map or slice of struct with named fields
			// Use context: if useMapKey is true, we treat it as map-like access
		}
	}

	if useMapKey || isMap {
		// Pattern B: Iterate Map Elements
		for _, elt := range lit.Elts {
			kv, ok := elt.(*ast.KeyValueExpr)
			if !ok {
				continue
			}
			// Key should be string literal
			if keyLit, ok := kv.Key.(*ast.BasicLit); ok && keyLit.Kind == token.STRING {
				name, _ := unquote(keyLit.Value)
				cases = append(cases, &model.TestCase{
					Name:   name,
					Line:   fset.Position(kv.Pos()).Line,
					Col:    fset.Position(kv.Pos()).Column,
					Source: "map_key",
				})
			}
		}
		return cases
	}

	// Pattern A: Iterate Slice Elements
	for _, elt := range lit.Elts {
		// elt is one test case struct: {name: "foo", ...}
		innerLit, ok := elt.(*ast.CompositeLit)
		if !ok {
			continue
		}

		c := &model.TestCase{
			Line:   fset.Position(innerLit.Pos()).Line,
			Col:    fset.Position(innerLit.Pos()).Column,
			Source: "table_literal",
		}

		// Store fields for fallback lookup
		fields := make(map[string]string)
		foundName := false
		foundDesc := ""

		// Scan fields
		for i, field := range innerLit.Elts {
			// Handle Named Fields
			if kv, ok := field.(*ast.KeyValueExpr); ok {
				if keyIdent, ok := kv.Key.(*ast.Ident); ok {
					k := strings.ToLower(keyIdent.Name)
					val := ""
					if vLit, ok := kv.Value.(*ast.BasicLit); ok && vLit.Kind == token.STRING {
						val, _ = unquote(vLit.Value)
					} else {
						val = "dynamic:" + exprToString(kv.Value)
					}

					fields[k] = val

					// If exact match to t.Run(tt.field)
					if fieldName != "" && strings.EqualFold(keyIdent.Name, fieldName) {
						c.Name = val
						foundName = true
					}
				}
				continue
			}

			// Handle Unkeyed Literal (Positional fields)
			// Heuristic: 1st element is name if string
			if i == 0 {
				if vLit, ok := field.(*ast.BasicLit); ok && vLit.Kind == token.STRING {
					val, _ := unquote(vLit.Value)
					if !foundName {
						c.Name = val
						foundName = true
					}
				}
			}
		}

		// Fallback if explicit fieldName match failed
		if !foundName {
			// Priority: name > desc > title > case > scenario
			candidates := []string{"name", "desc", "title", "case", "scenario"}
			for _, key := range candidates {
				if v, ok := fields[key]; ok {
					c.Name = v
					foundName = true
					break
				}
			}
		}

		// Desc fallback
		if v, ok := fields["desc"]; ok {
			foundDesc = v
		}

		if c.Name == "" {
			c.Name = "unnamed_case"
		}
		c.Desc = foundDesc
		cases = append(cases, c)
	}

	return cases
}

func unquote(s string) (string, error) {
	return strconv.Unquote(s)
}

func exprToString(expr ast.Expr) string {
	// Simplified representation of expression
	switch t := expr.(type) {
	case *ast.BasicLit:
		return t.Value
	case *ast.Ident:
		return t.Name
	case *ast.SelectorExpr:
		return exprToString(t.X) + "." + t.Sel.Name
	default:
		return "expr"
	}
}
