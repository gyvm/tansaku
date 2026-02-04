from typing import Dict

CHARS: Dict[str, str] = {
    "trunk": "┃",           # 幹(太い縦線)
    "branch": "│",          # 枝(細い縦線)
    "branch_diagonal": "╱", # 斜め枝(右上)
    "branch_diagonal_left": "╲", # 斜め枝(左上)
    "merge_horizontal": "═══╪═══", # マージ(接ぎ木)
    "root": "┗━━━",         # 根元
}

EMOJIS: Dict[str, str] = {
    "active": "🌿",    # アクティブなブランチ
    "recent": "🍃",    # 最近のブランチ
    "merged": "🍂",    # マージ済み/削除済み
}
