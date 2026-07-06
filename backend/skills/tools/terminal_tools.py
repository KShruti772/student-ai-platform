"""
Terminal tools for running shell commands locally.

These are intentionally simple wrappers around subprocess for local-first usage.
"""
import subprocess
from typing import List, Tuple
from utils.logger import get_logger

_LOG = get_logger(__name__)


def run_command(cmd: List[str], cwd: str = None, timeout: int = 30) -> Tuple[int, str, str]:
    """Run a command and return (returncode, stdout, stderr)."""
    _LOG.info("Running command: %s (cwd=%s)", " ".join(cmd), cwd)
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=cwd, text=True)
    try:
        out, err = proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        proc.kill()
        out, err = proc.communicate()
        return proc.returncode, out, err
    return proc.returncode, out, err
