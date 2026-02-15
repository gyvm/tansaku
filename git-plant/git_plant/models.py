from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional

from git_plant.constants import EMOJIS

class BranchStatus(Enum):
    ACTIVE = "active"      # 🌿
    RECENT = "recent"      # 🍃
    MERGED = "merged"      # 🍂

@dataclass
class Commit:
    hash: str
    short_hash: str        # 7 chars
    author: str
    message: str
    date: datetime
    parents: List[str]

@dataclass
class Branch:
    name: str
    tip_commit: Commit
    status: BranchStatus

    # Metadata for visualization
    created_at: Optional[datetime] = None
    last_commit_at: Optional[datetime] = None
    parent_branch: Optional[str] = None
    fork_point_hash: Optional[str] = None # Hash where this branch diverged
    merge_commit_hash: Optional[str] = None # Hash where this branch was merged

    # Commits specific to this branch (divergent from parent)
    commits: List[Commit] = field(default_factory=list)

    @property
    def emoji(self) -> str:
        return {
            BranchStatus.ACTIVE: EMOJIS["active"],
            BranchStatus.RECENT: EMOJIS["recent"],
            BranchStatus.MERGED: EMOJIS["merged"],
        }[self.status]

@dataclass
class TreeNode:
    branch: Branch
    x: int  # Horizontal position (lane)
    y_start: int # Vertical start position (fork point index/time)
    y_end: int   # Vertical end position (tip index/time)
    children: List['TreeNode'] = field(default_factory=list)
