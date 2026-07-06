"""
Beginner-friendly logging helper.

Purpose:
- Provide a reusable logger configured for readable structured messages.
- Keep logging simple so students can follow runtime behavior.
"""
import logging
import time
from functools import wraps


def get_logger(name: str = __name__):
    """Return a configured logger.

    The logger is intentionally simple and prints readable timestamps so
    students can follow runtime behavior. Handlers are only added once.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s - %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


def log_execution(logger):
    """Decorator to log execution time, inputs and errors for a function.

    Use this in API routes and critical functions to improve observability.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            logger.info("Starting %s", func.__name__)
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start
                logger.info("Finished %s in %.3fs", func.__name__, duration)
                return result
            except Exception as e:
                duration = time.time() - start
                logger.exception("Error in %s after %.3fs: %s", func.__name__, duration, e)
                raise

        return wrapper

    return decorator
