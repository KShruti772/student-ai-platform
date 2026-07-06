"""
File Generator

Generates project files and folder structure based on architect decisions and
templates. Uses local-first file writes and returns a manifest of created files.
"""
from typing import Dict, Any, List
from pathlib import Path
from skills.tools.file_tools import write_file
from utils.logger import get_logger

_LOG = get_logger(__name__)


class FileGenerator:
    def __init__(self):
        pass

    def generate_structure(self, base: str, folders: List[str]) -> Dict[str, Any]:
        created = []
        basep = Path(base)
        for f in folders:
            p = basep / f
            p.mkdir(parents=True, exist_ok=True)
            created.append(str(p))
        return {"folders": created}

    def write_files(self, files: List[Dict[str, str]]) -> Dict[str, Any]:
        """`files` is list of {'path':..., 'content':...} dictionaries."""
        created = []
        for f in files:
            path = f.get("path")
            content = f.get("content", "")
            write_file(path, content, overwrite=True)
            created.append(path)
            _LOG.info("Generated file %s", path)
        return {"created_files": created}

    def scaffold_project(self, base: str, spec: Dict[str, Any]) -> Dict[str, Any]:
        # spec: {'folders': [...], 'files': [...]}
        res1 = self.generate_structure(base, spec.get("folders", []))
        res2 = self.write_files(spec.get("files", []))
        return {"folders": res1["folders"], "files": res2["created_files"]}
