import pytest
from datetime import datetime
from git_plant.models import Branch, Commit, BranchStatus
from git_plant.tree_builder import TreeBuilder

def make_commit(h, date_str):
    return Commit(h, h[:7], "me", "msg", datetime.fromisoformat(date_str), [])

def test_builder_lanes():
    commits = [
        make_commit("hash5", "2023-01-05"), # Newest
        make_commit("hash4", "2023-01-04"),
        make_commit("hash3", "2023-01-03"),
        make_commit("hash2", "2023-01-02"),
        make_commit("hash1", "2023-01-01"), # Oldest
    ]

    # Timeline indices:
    # hash1 (0), hash2 (1), hash3 (2), hash4 (3), hash5 (4)

    branches = [
        Branch("main", commits[0], BranchStatus.ACTIVE, fork_point_hash=None), # Y: 0-4, X:0
        Branch("f1", commits[1], BranchStatus.ACTIVE, fork_point_hash="hash2", parent_branch="main"), # Y: 1-3
        Branch("f2", commits[0], BranchStatus.ACTIVE, fork_point_hash="hash3", parent_branch="main"), # Y: 2-4
    ]

    builder = TreeBuilder()
    nodes = builder.build(branches, commits)

    # Validate main
    main_node = next(n for n in nodes if n.branch.name == "main")
    assert main_node.x == 0
    assert main_node.y_start == 0
    assert main_node.y_end == 4

    # Validate f1
    f1_node = next(n for n in nodes if n.branch.name == "f1")
    assert f1_node.y_start == 1
    assert f1_node.y_end == 3
    assert f1_node.x != 0 # Should be assigned a lane

    # Validate f2
    f2_node = next(n for n in nodes if n.branch.name == "f2")
    assert f2_node.y_start == 2
    assert f2_node.y_end == 4
    assert f2_node.x != 0
    assert f2_node.x != f1_node.x # Should not overlap in lane index if they overlap in Y?

    # f1 occupies lane from Y=1 to Y=3 (blocked until 4)
    # f2 starts at Y=2.
    # f1 is using a lane at Y=2. So f2 must pick a diff lane.
    assert f2_node.x != f1_node.x
