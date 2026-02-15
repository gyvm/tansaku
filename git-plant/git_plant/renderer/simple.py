from typing import List, Dict, Optional
from rich.console import Console
from rich.text import Text

from git_plant.models import TreeNode, BranchStatus
from git_plant.constants import CHARS, EMOJIS

class SimpleRenderer:
    def __init__(self, nodes: List[TreeNode]):
        self.nodes = nodes
        self.console = Console()

    def render(self):
        if not self.nodes:
            self.console.print("No branches to display.")
            return

        # 1. Determine Grid Dimensions
        max_y = max(n.y_end for n in self.nodes)
        min_x = min(n.x for n in self.nodes)
        max_x = max(n.x for n in self.nodes)

        SCALE_X = 10

        # Calculate needed width for the left side (negative X) to fit labels
        # This is hard to predict without measuring labels.
        # Let's allocate a fixed margin or just be dynamic.

        # Center column index
        # We need enough space on the left for the leftmost branch's lane + label.
        # Let's start with a generous offset.
        # Assume max label length ~20 chars?

        min_x_val = min(0, min_x)
        center_offset = abs(min_x_val) * SCALE_X + 25 # +25 for left-side labels

        canvas_width = center_offset + (max(0, max_x) * SCALE_X) + 30 # +30 for right-side labels

        # 2. Render Line by Line (Top to Bottom)
        for y in range(max_y, -1, -1):
            row_chars: Dict[int, str] = {}
            labels_to_draw: List[Dict] = [] # {start_idx, text}

            # Find nodes active at this Y
            for node in self.nodes:
                grid_x = center_offset + (node.x * SCALE_X)

                is_tip = (y == node.y_end)
                is_sprout = (y == node.y_start)
                is_stem = (node.y_start < y < node.y_end)

                char_to_draw = None

                if is_stem:
                    if node.x == 0:
                        char_to_draw = CHARS["trunk"]
                    else:
                        char_to_draw = CHARS["branch"]

                elif is_tip:
                    emoji = node.branch.emoji
                    name = node.branch.name

                    if node.x < 0:
                        # Left side: Name Emoji
                        # Align so Emoji is at grid_x (or near it)
                        # Actually, if stem is at grid_x, we want leaf at grid_x too.
                        # So "Name Emoji" ends at grid_x + something?
                        # Let's put Emoji at grid_x.

                        # Case 1: Left Branch
                        # Label: "Name 🍂"
                        # We want the "stem" connection point to be the Emoji.
                        # So text ends at grid_x + 1 (assuming emoji width 2?)
                        # Simpler: End at grid_x + 1

                        full_label = f"{name} {emoji}"
                        # Start position = grid_x - len(name) - 1 + adjustment
                        # Let's just store the label and anchor point
                        labels_to_draw.append({
                            "text": full_label,
                            "anchor": grid_x,
                            "align": "right"
                        })

                    else:
                        # Right side (or trunk): Emoji Name
                        full_label = f"{emoji} {name}"
                        labels_to_draw.append({
                            "text": full_label,
                            "anchor": grid_x,
                            "align": "left"
                        })

                elif is_sprout:
                    if node.x == 0:
                        char_to_draw = CHARS["root"]
                    else:
                        if node.x > 0:
                            char_to_draw = CHARS["branch_diagonal"]
                        else:
                            char_to_draw = CHARS["branch_diagonal_left"]

                if char_to_draw:
                    row_chars[grid_x] = char_to_draw

            # Grafts (Merged Status)
            for node in self.nodes:
                if y == node.y_end and node.branch.status == BranchStatus.MERGED:
                    # Draw horizontal line from node to trunk (0)
                    start_x = min(0, node.x)
                    end_x = max(0, node.x)

                    g_start = center_offset + (start_x * SCALE_X)
                    g_end = center_offset + (end_x * SCALE_X)

                    r_start = g_start + 1
                    r_end = g_end

                    for cx in range(r_start, r_end):
                        if cx not in row_chars:
                            row_chars[cx] = "═"

            # Construct Base String
            # Ensure sufficient length
            max_idx = max([k for k in row_chars.keys()] + [center_offset + 50])
            # approximate max needed

            line_chars = [" "] * (max_idx + 10)

            for idx, char in row_chars.items():
                line_chars[idx] = char

            base_str = "".join(line_chars)

            # Overlay Labels
            # We construct a new string carefully
            # To avoid index errors, let's work with the list `line_chars` but it's hard with multi-char labels.
            # Let's use string slicing on base_str.

            # Sort labels to process?
            # It's better to just splice them in.

            for label_info in labels_to_draw:
                text = label_info["text"]
                anchor = label_info["anchor"]
                align = label_info["align"]

                if align == "left":
                    # Start at anchor
                    pos = anchor
                    # If we blindly replace, we might overwrite.
                    # But tips usually have priority.

                    # Pad if needed
                    if len(base_str) < pos:
                        base_str += " " * (pos - len(base_str))

                    base_str = base_str[:pos] + text + base_str[pos+len(text):]

                else: # Right align
                    # Ends at anchor (inclusive? exclusive?)
                    # If text is "Name 🍂", and anchor is where the stem was.
                    # We want "🍂" to be at anchor.
                    # So text ends at anchor + emoji_width?
                    # Let's say it ends at anchor + 1.

                    # Len of text.
                    # Start pos = (anchor + 1) - len(text)
                    pos = (anchor + 2) - len(text) # +2 roughly for Emoji width correction

                    if pos < 0: pos = 0

                    if len(base_str) < pos:
                        base_str += " " * (pos - len(base_str))

                    # Splice
                    # Careful not to mess up string length if we are inserting
                    # Python strings are immutable, creating new one.

                    # We overwrite
                    prefix = base_str[:pos]
                    suffix = base_str[pos+len(text):]
                    base_str = prefix + text + suffix

            self.console.print(base_str.rstrip())
