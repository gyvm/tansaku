import click
import sys
import os
from rich.console import Console

from git_plant.git_parser import GitParser
from git_plant.tree_builder import TreeBuilder
from git_plant.renderer.simple import SimpleRenderer

@click.command()
@click.option('--repo', default='.', help='Path to the git repository.')
@click.option('--depth', default=50, help='Limit the number of commits to parse (height of the tree).')
@click.option('--all', 'show_all', is_flag=True, help='Show full history (overrides depth).')
@click.option('--verbose', is_flag=True, help='Show debug information.')
def main(repo, depth, show_all, verbose):
    """
    Git Plant 🌿

    Visualize your Git branch structure as a growing plant.
    """
    console = Console()

    try:
        # Resolve repo path
        repo_path = os.path.abspath(repo)
        if not os.path.exists(os.path.join(repo_path, ".git")):
            console.print(f"[bold red]Error:[/bold red] {repo_path} is not a valid git repository.")
            sys.exit(1)

        if verbose:
            console.print(f"[dim]Analyzing repository at {repo_path}...[/dim]")

        # 1. Parse Git Data
        parser = GitParser(repo_path)

        limit = None if show_all else depth
        if verbose:
            console.print(f"[dim]Fetching commits (Limit: {limit if limit else 'All'})...[/dim]")

        commits = parser.get_ordered_commits(limit=limit)

        if not commits:
            console.print("[yellow]No commits found.[/yellow]")
            return

        if verbose:
            console.print(f"[dim]Fetched {len(commits)} commits.[/dim]")
            console.print(f"[dim]Fetching branches...[/dim]")

        branches = parser.get_branches()

        if verbose:
            console.print(f"[dim]Found {len(branches)} branches.[/dim]")

        # 2. Build Tree
        builder = TreeBuilder()
        nodes = builder.build(branches, commits)

        if not nodes:
            console.print("[yellow]No tree structure could be built.[/yellow]")
            return

        # 3. Render
        if verbose:
            console.print("[dim]Rendering tree...[/dim]")

        renderer = SimpleRenderer(nodes)
        renderer.render()

    except Exception as e:
        console.print(f"[bold red]An unexpected error occurred:[/bold red] {e}")
        if verbose:
            raise e
        sys.exit(1)

if __name__ == '__main__':
    main()
