from typing import List, Dict, Optional
from git_plant.models import Branch, Commit, TreeNode

class TreeBuilder:
    def build(self, branches: List[Branch], commits: List[Commit]) -> List[TreeNode]:
        """
        Builds a list of TreeNodes with X/Y coordinates assigned.

        Args:
            branches: List of branches to visualize.
            commits: Ordered list of commits (Newest -> Oldest) defining the vertical timeline.
        """
        if not branches:
            return []

        # 1. Establish Y-Axis (Time)
        # Reverse commits to be Oldest -> Newest (Bottom -> Top)
        timeline_commits = list(reversed(commits))
        hash_to_y: Dict[str, int] = {c.hash: i for i, c in enumerate(timeline_commits)}

        max_y = len(timeline_commits) - 1

        # 2. Convert Branches to Nodes with Y-coordinates
        nodes: List[TreeNode] = []

        # Identify main branch
        main_nodes = [b for b in branches if b.name in ['main', 'master']]
        main_branch = main_nodes[0] if main_nodes else branches[0]

        # Sort other branches by creation time (y_start)
        other_branches = [b for b in branches if b != main_branch]

        # Helper to get Y for a hash, defaulting to 0 if not found (older than limit)
        def get_y(commit_hash: Optional[str]) -> int:
            if not commit_hash:
                return 0
            return hash_to_y.get(commit_hash, 0)

        # Create Main Node
        main_node = TreeNode(
            branch=main_branch,
            x=0,
            y_start=0,
            y_end=get_y(main_branch.tip_commit.hash),
            children=[]
        )
        nodes.append(main_node)

        # Prepare others with Y-coordinates for sorting
        temp_nodes = []
        for b in other_branches:
            y_start = get_y(b.fork_point_hash)
            y_end = get_y(b.tip_commit.hash)
            # Ensure y_end >= y_start (sanity check)
            if y_end < y_start:
                y_end = y_start

            temp_nodes.append({
                "branch": b,
                "y_start": y_start,
                "y_end": y_end
            })

        # Sort by y_start
        temp_nodes.sort(key=lambda n: n["y_start"])

        # 3. Assign X-Axis (Lanes)
        # We need to find free lanes.
        # Lanes: {x_index: max_occupied_y}
        # Start with lane 1, -1, 2, -2...

        # Using a list of lanes. Each lane tracks the y_end of the last placed segment.
        # We want to keep the tree balanced, so we alternate left/right.
        # Structure: right_lanes[i] = free_at_y, left_lanes[i] = free_at_y

        right_lanes: List[int] = [] # index i corresponds to x = i + 1
        left_lanes: List[int] = []  # index i corresponds to x = -(i + 1)

        for item in temp_nodes:
            y_s = item["y_start"]
            y_e = item["y_end"]

            # Try to find a spot in existing lanes
            # We look for a lane where lane_free_y <= y_s

            placed = False

            # Prefer Right, then Left, then Right new, then Left new...
            # Or just alternate for visual balance.
            # Let's try to fit in the innermost available lane to keep tree compact.

            # Check Right lanes
            best_lane_idx = -1
            side = None # 'right' or 'left'

            # Naive approach: check all right lanes, then all left lanes
            # Find the first lane that is free.

            for i, free_y in enumerate(right_lanes):
                if free_y <= y_s:
                    best_lane_idx = i
                    side = 'right'
                    break

            if best_lane_idx == -1:
                for i, free_y in enumerate(left_lanes):
                    if free_y <= y_s:
                        best_lane_idx = i
                        side = 'left'
                        break

            # If still not found, add a new lane.
            # Balance the number of lanes.
            if best_lane_idx == -1:
                if len(right_lanes) <= len(left_lanes):
                    right_lanes.append(0)
                    best_lane_idx = len(right_lanes) - 1
                    side = 'right'
                else:
                    left_lanes.append(0)
                    best_lane_idx = len(left_lanes) - 1
                    side = 'left'

            # Calculate actual X
            if side == 'right':
                x = best_lane_idx + 1 # 1, 2, 3...
                right_lanes[best_lane_idx] = y_e + 1 # Reserve space, +1 for buffer
            else:
                x = -(best_lane_idx + 1) # -1, -2, -3...
                left_lanes[best_lane_idx] = y_e + 1

            node = TreeNode(
                branch=item["branch"],
                x=x,
                y_start=y_s,
                y_end=y_e,
                children=[]
            )
            nodes.append(node)

            # Add to parent's children list
            # Find parent node.
            # Note: For now, we assume parent is main or we find the node corresponding to parent name.
            # Ideally we link to the node that actually covers the fork point.
            # But simpler is just linking to the node with the branch name.
            parent_name = item["branch"].parent_branch
            if parent_name:
                parent_node = next((n for n in nodes if n.branch.name == parent_name), None)
                if parent_node:
                    parent_node.children.append(node)
                else:
                    # Parent not found (maybe outside limit or main), attach to main as fallback
                    main_node.children.append(node)
            else:
                main_node.children.append(node)

        return nodes
