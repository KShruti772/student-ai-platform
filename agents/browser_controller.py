"""Async browser controller using Playwright.

Provides a high-level, safe wrapper around Playwright for navigation,
content extraction, and simple automation steps. Designed to be used by
research agents and to emit explainable actions.

Note: Requires `playwright` to be installed and browsers to be installed via
`playwright install` when running locally. The code gracefully falls back to
requests-based scraping when Playwright isn't available.
"""
from typing import Optional, Dict, Any
import asyncio
import json
from pathlib import Path

try:
    from playwright.async_api import async_playwright, Page, Browser
    PLAYWRIGHT_AVAILABLE = True
except Exception:
    PLAYWRIGHT_AVAILABLE = False

from utils.logger import get_logger
from agents.safety_guard import SafetyGuard

_LOG = get_logger(__name__)

CACHE_DIR = Path("data/web_cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)


class BrowserController:
    def __init__(self, headless: bool = True, guard: Optional[SafetyGuard] = None):
        self.headless = headless
        self._pw = None
        self._browser: Optional[Browser] = None
        self._page: Optional[Page] = None
        self.guard = guard or SafetyGuard()

    async def start(self):
        if not PLAYWRIGHT_AVAILABLE:
            _LOG.warning("Playwright not available; browser automation disabled")
            return
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(headless=self.headless)
        self._page = await self._browser.new_page()
        _LOG.info("Browser started")

    async def stop(self):
        try:
            if self._page:
                await self._page.close()
            if self._browser:
                await self._browser.close()
            if self._pw:
                await self._pw.stop()
            _LOG.info("Browser stopped")
        except Exception as e:
            _LOG.warning("Error stopping browser: %s", e)

    async def goto(self, url: str, explain: Optional[Dict[str, Any]] = None, timeout: int = 30000) -> Dict[str, Any]:
        """Navigate to a URL with safety checks. Returns a summary dict."""
        action = {"action": "goto", "url": url, "explain": explain}
        if not self.guard.is_allowed_domain(url):
            action["blocked"] = True
            action["reason"] = "domain not whitelisted"
            _LOG.info("Blocked navigation to %s", url)
            return action

        if not PLAYWRIGHT_AVAILABLE:
            # minimal fallback: requests fetch
            import requests
            resp = requests.get(url, timeout=10)
            action["status_code"] = resp.status_code
            action["content_snippet"] = resp.text[:1000]
            return action

        page = self._page
        if not page:
            await self.start()
            page = self._page
        try:
            await page.goto(url, timeout=timeout)
            content = await page.content()
            action["status_code"] = 200
            action["content_snippet"] = content[:2000]
            return action
        except Exception as e:
            action["error"] = str(e)
            return action

    async def click(self, selector: str, explain: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not PLAYWRIGHT_AVAILABLE or not self._page:
            return {"action": "click", "selector": selector, "error": "playwright not available"}
        try:
            await self._page.click(selector)
            return {"action": "click", "selector": selector, "ok": True}
        except Exception as e:
            return {"action": "click", "selector": selector, "error": str(e)}

    async def extract_text(self, selector: Optional[str] = None) -> str:
        if not PLAYWRIGHT_AVAILABLE or not self._page:
            return ""
        if selector:
            try:
                el = await self._page.query_selector(selector)
                if not el:
                    return ""
                return await el.inner_text()
            except Exception:
                return ""
        else:
            try:
                return await self._page.content()
            except Exception:
                return ""

    async def screenshot(self, path: str):
        if not PLAYWRIGHT_AVAILABLE or not self._page:
            return None
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        await self._page.screenshot(path=path, full_page=True)
        return str(p)


if __name__ == "__main__":
    async def main():
        bc = BrowserController(headless=True)
        await bc.start()
        res = await bc.goto('https://example.com', explain={"why":"demo"})
        print(res)
        await bc.stop()

    asyncio.run(main())
