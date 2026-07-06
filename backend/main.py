"""Module entrypoint to expose the FastAPI `app` for uvicorn.

Having this `main.py` in the `backend` folder ensures that running
`uvicorn main:app` from `backend/` imports this file, not any other
`main.py` that might exist elsewhere on the PYTHONPATH (for example
inside a `venv/` folder). This prevents accidental shadowing which
caused only the root `/` route to be visible.
"""
from app import app

__all__ = ["app"]
