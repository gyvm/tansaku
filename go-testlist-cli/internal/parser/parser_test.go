package parser

import (
	"testing"
)

func TestParseDir(t *testing.T) {
	// Use the testdata directory we created
	// We are running from internal/parser, so ../../testdata
	testDataPath := "../../testdata"

	out, err := ParseDir(testDataPath)
	if err != nil {
		t.Fatalf("ParseDir failed: %v", err)
	}

	if len(out.Packages) == 0 {
		t.Fatalf("Expected at least 1 package, got 0")
	}

	pkg := out.Packages[0]
	// Basic validation of the manual check we just did
	foundFuncs := make(map[string]int)
	for _, f := range pkg.Files {
		for _, tf := range f.Tests {
			foundFuncs[tf.Name] = len(tf.Cases)
		}
	}

	expected := map[string]int{
		"TestPatternA":             2,
		"TestPatternB":             2,
		"TestPatternC":             1,
		"TestPatternMixed":         1,
		"TestPatternImplicitField": 1,
	}

	for name, count := range expected {
		if got, ok := foundFuncs[name]; !ok {
			t.Errorf("Expected function %s not found", name)
		} else if got != count {
			t.Errorf("Function %s: expected %d cases, got %d", name, count, got)
		}
	}
}
