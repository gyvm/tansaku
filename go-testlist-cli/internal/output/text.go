package output

import (
	"fmt"
	"io"

	"go-testlist-cli/internal/model"
)

// WriteText writes the output model as a text tree to the writer
func WriteText(w io.Writer, out *model.Output) error {
	for _, pkg := range out.Packages {
		fmt.Fprintf(w, "- package: %s\n", pkg.ImportPath)
		for _, file := range pkg.Files {
			fmt.Fprintf(w, "  - file: %s\n", file.Path)
			for _, test := range file.Tests {
				fmt.Fprintf(w, "    - %s\n", test.Name)
				for _, c := range test.Cases {
					fmt.Fprintf(w, "      - %s\n", c.Name)
				}
			}
		}
	}
	return nil
}
