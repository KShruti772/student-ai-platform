"""Debug tools: parse stack traces and suggest fixes (LLM-assisted)."""
from typing import Dict, Any
from utils.logger import get_logger
import re
import importlib

_LOG = get_logger(__name__)


def parse_traceback(tb: str) -> Dict[str, Any]:
    # Very small parser: extract exception type and last file/line
    m_exc = re.search(r"([\w\.]+Error): (.*)", tb)
    exception = m_exc.group(1) if m_exc else "Error"
    message = m_exc.group(2) if m_exc else ""
    m_loc = re.search(r"File \"(.+?)\", line (\d+), in (.+)", tb)
    location = {"file": m_loc.group(1), "line": int(m_loc.group(2)), "func": m_loc.group(3)} if m_loc else {}
    return {"exception": exception, "message": message, "location": location}


def suggest_fix(traceback: str) -> Dict[str, Any]:
    # Ask local LLM for suggestion if available
    try:
        mod = importlib.import_module("local_ai.llm_client")
        llm = getattr(mod, "default_llm")
        prompt = (
            "Given this Python traceback, suggest a minimal fix and explain why:\n"
            + traceback
            + "\nReturn JSON: {\"fix\": \"...\", \"explanation\": \"...\" }"
        )
        resp = llm.generate_response(prompt)
        return {"llm": resp}
    except Exception:
        _LOG.info("LLM not available; returning parsed traceback only")
        return {"parsed": parse_traceback(traceback)}
