"""
Basic git tools used by skills.
"""
from typing import Tuple
from .terminal_tools import run_command


def git_status(repo_path: str = ".") -> Tuple[int, str, str]:
    return run_command(["git", "status", "--porcelain"], cwd=repo_path)


def git_log(repo_path: str = ".", n: int = 5) -> Tuple[int, str, str]:
    return run_command(["git", "log", f"-n", str(n), "--oneline"], cwd=repo_path)
