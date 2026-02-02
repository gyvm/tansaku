package output

import (
	"encoding/json"
	"io"

	"go-testlist-cli/internal/model"
)

// WriteJSON writes the output model as JSON to the writer
func WriteJSON(w io.Writer, out *model.Output) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(out)
}
