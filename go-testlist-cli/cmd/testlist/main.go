package main

import (
	"flag"
	"fmt"
	"os"

	"go-testlist-cli/internal/output"
	"go-testlist-cli/internal/parser"
)

func main() {
	jsonFlag := flag.Bool("json", false, "Output in JSON format")
	formatFlag := flag.String("format", "text", "Output format (text|json)")
	maxDynamicLen := flag.Int("max-dynamic-len", 80, "Max length for dynamic expressions (ignored in MVP)")
	failOnError := flag.Bool("fail-on-error", false, "Exit with code 1 if parsing errors occur")

	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage: testlist [options] [path]\n")
		flag.PrintDefaults()
	}

	flag.Parse()

	// Determine output format
	useJSON := *jsonFlag || *formatFlag == "json"

	// Determine target path
	args := flag.Args()
	targetPath := "."
	if len(args) > 0 {
		targetPath = args[0]
	}

	// Handle ./... as .
	if targetPath == "./..." {
		targetPath = "."
	}

	// Warn about ignored flags if verbose? No, keep it silent.
	_ = maxDynamicLen

	out, err := parser.ParseDir(targetPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing directory: %v\n", err)
		if *failOnError {
			os.Exit(1)
		}
	}

	// Output
	if useJSON {
		if err := output.WriteJSON(os.Stdout, out); err != nil {
			fmt.Fprintf(os.Stderr, "Error writing JSON: %v\n", err)
			os.Exit(1)
		}
	} else {
		if err := output.WriteText(os.Stdout, out); err != nil {
			fmt.Fprintf(os.Stderr, "Error writing text: %v\n", err)
			os.Exit(1)
		}
	}
}
