"""Scraper abstraction that uses BrowserController or requests as fallback.

Provides polite scraping with caching and simple rate-limiting.
"""
import asyncio
import hashlib
import json
import time
from pathlib import Path
from typing import Optional, Dict, Any

from utils.logger import get_logger
from agents.browser_controller import BrowserController
from agents.safety_guard import SafetyGuard

_LOG = get_logger(__name__)
CACHE_DIR = Path("data/web_cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)


class Scraper:
    def __init__(self, headless: bool = True, guard: Optional[SafetyGuard] = None):
        self.guard = guard or SafetyGuard()
        self.browser = BrowserController(headless=headless, guard=self.guard)
        self._lock = asyncio.Lock()

    def _cache_path(self, url: str) -> Path:
        h = hashlib.sha1(url.encode("utf-8")).hexdigest()
        return CACHE_DIR / f"{h}.json"

    def _read_cache(self, url: str, ttl: int = 60 * 60 * 24) -> Optional[Dict[str, Any]]:
        p = self._cache_path(url)
        if not p.exists():
            return None
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            if time.time() - data.get("ts", 0) > ttl:
                return None
            return data.get("payload")
        except Exception:
            return None

    def _write_cache(self, url: str, payload: Dict[str, Any]):
        p = self._cache_path(url)
        p.write_text(json.dumps({"ts": time.time(), "payload": payload}), encoding="utf-8")

    async def fetch(self, url: str, force_refresh: bool = False) -> Dict[str, Any]:
        if not self.guard.is_allowed_domain(url):
            return {"error": "domain not allowed", "url": url}

        if not force_refresh:
            cached = self._read_cache(url)
            if cached is not None:
                return {"cached": True, "payload": cached}

        # ensure only one browser start happens at a time
        async with self._lock:
            await self.browser.start()
            res = await self.browser.goto(url)
            if res.get("status_code") == 200 or res.get("content_snippet"):
                payload = {"url": url, "content_snippet": res.get("content_snippet"), "meta": {}}
                self._write_cache(url, payload)
                return {"cached": False, "payload": payload}
            else:
                return {"error": "failed_fetch", "detail": res}

    async def close(self):
        await self.browser.stop()


if __name__ == "__main__":
    async def main():
        s = Scraper()
        r = await s.fetch('https://example.com')
        print(r)
        await s.close()
    asyncio.run(main())
