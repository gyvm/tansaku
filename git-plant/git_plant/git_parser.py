from datetime import datetime, timezone
from typing import List, Optional, Dict, Set
import git
from git.repo import Repo
from git.objects import Commit as GitCommit

from git_plant.models import Branch, Commit, BranchStatus

class GitParser:
    def __init__(self, repo_path: str = "."):
        self.repo = Repo(repo_path)
        self.main_branch_name = self._detect_main_branch()

    def _detect_main_branch(self) -> str:
        for name in ["main", "master"]:
            if name in self.repo.heads:
                return name
        if not self.repo.heads:
             raise ValueError("No branches found in repository.")
        return self.repo.active_branch.name

    def _convert_commit(self, commit: GitCommit) -> Commit:
        return Commit(
            hash=commit.hexsha,
            short_hash=commit.hexsha[:7],
            author=commit.author.name,
            message=commit.message.strip(),
            date=commit.committed_datetime,
            parents=[p.hexsha for p in commit.parents]
        )

    def get_ordered_commits(self, limit: int = 50) -> List[Commit]:
        """
        Returns a list of commits sorted by date (newest first), across all branches.
        Used to establish the Y-axis timeline.
        """
        commits = []
        # sort='DATE_ORDER' ensures topological consistency where possible but prioritizes time
        for commit in self.repo.iter_commits(all=True, max_count=limit):
            commits.append(self._convert_commit(commit))
        return commits # Returns Newest -> Oldest

    def get_branches(self) -> List[Branch]:
        """
        Parses the repository and returns a list of Branch objects.
        """
        branches: List[Branch] = []

        # Check if we have any branches
        if not self.repo.heads:
            return []

        main_branch = self.repo.heads[self.main_branch_name]

        # Get list of merged branches
        merged_branches = self._get_merged_branches(self.main_branch_name)

        # Sort branches: Main first, then others
        all_heads = [main_branch] + [h for h in self.repo.heads if h.name != self.main_branch_name]

        for head in all_heads:
            if not head.is_valid():
                continue

            status = self._determine_status(head, merged_branches)
            tip_commit = self._convert_commit(head.commit)

            fork_point_hash = None
            parent_branch_name = None

            if head.name != self.main_branch_name:
                # Find best common ancestor
                try:
                    fork_commit = self.repo.merge_base(self.main_branch_name, head)
                    if fork_commit:
                        fork_point_hash = fork_commit[0].hexsha
                        parent_branch_name = self.main_branch_name
                except Exception:
                    # Fallback if merge-base fails (e.g. orphan branches)
                    pass

            branch = Branch(
                name=head.name,
                tip_commit=tip_commit,
                status=status,
                last_commit_at=head.commit.committed_datetime,
                parent_branch=parent_branch_name,
                fork_point_hash=fork_point_hash,
            )
            branches.append(branch)

        return branches

    def _get_merged_branches(self, target_branch: str) -> Set[str]:
        """Returns a set of branch names that are fully merged into target_branch."""
        try:
            merged_refs = self.repo.git.branch(merged=target_branch).split('\n')
            return {ref.strip().lstrip('* ').strip() for ref in merged_refs}
        except git.GitCommandError:
            return set()

    def _determine_status(self, head: git.Head, merged_branches: Set[str]) -> BranchStatus:
        # 1. Active: Currently checked out
        try:
            if not self.repo.head.is_detached and head == self.repo.active_branch:
                return BranchStatus.ACTIVE
        except (TypeError, ValueError):
            pass

        # 2. Merged
        if head.name in merged_branches and head.name != self.main_branch_name:
            return BranchStatus.MERGED

        # 3. Active vs Recent
        now = datetime.now(timezone.utc)
        commit_time = head.commit.committed_datetime

        if commit_time.tzinfo is None:
             commit_time = commit_time.replace(tzinfo=timezone.utc)

        delta = now - commit_time

        if delta.days < 7:
            return BranchStatus.ACTIVE
        else:
            return BranchStatus.RECENT
