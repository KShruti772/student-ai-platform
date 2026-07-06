"""Research Agent: searches local FAISS-backed RAG store and performs web research.

Supports two modes:
- local: uses a provided index with `.search(query, k)`
- web: performs autonomous web research using the scraper/browser, stores results
  in a semantic memory, and returns explainable actions.

This file preserves the original `handle()` contract so it can still be used by
existing orchestrators while adding `web_search()` functionality for browser-driven research.
"""
from typing import Dict, Any, List, Optional
from .base_agent import BaseAgent
from .logger import get_logger
import os

from agents.scraper import Scraper
from agents.documentation_parser import parse_html, extract_code_blocks
from agents.research_memory import ResearchMemory

_LOG = get_logger(__name__)


class ResearchAgent(BaseAgent):
    def __init__(self, index=None, headless: bool = True):
        super().__init__("ResearchAgent")
        self.index = index  # optional FAISS wrapper provided by caller
        self.scraper = Scraper(headless=headless)
        self.memory = ResearchMemory()

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Route between local index search and web research based on payload.

        payload['mode'] can be 'local' (default) or 'web'.
        """
        mode = payload.get("mode", "local")
        if mode == "web":
            query = payload.get("query")
            if not query:
                return {"error": "no_query"}
            return await self.web_search(query)

        # default: local index search
        query = payload.get("query")
        k = int(payload.get("k", 5))
        if not query:
            return {"error": "no_query"}
        hits: List[Dict[str, Any]] = []
        if self.index:
            for text, score in self.index.search(query, k=k):
                hits.append({"text": text, "score": float(score)})
        else:
            _LOG.info("No index available; returning empty context")
        return {"query": query, "hits": hits}

    async def web_search(self, query: str, max_sites: int = 6) -> Dict[str, Any]:
        """Perform a simple web research pipeline: search, visit top results, parse, store memory."""
        search_url = "https://duckduckgo.com/html/?q=" + query.replace(' ', '+')
        _LOG.info("Starting web search for %s", query)
        sr = await self.scraper.fetch(search_url)
        if sr.get('error'):
            return {"error": "search_failed", "detail": sr}
        html = sr['payload']['content_snippet']
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        anchors = [a.get('href') for a in soup.find_all('a') if a.get('href')]
        anchors = [a for a in anchors if a and a.startswith('http')][:max_sites]
        results = []
        for a in anchors:
            fetched = await self.scraper.fetch(a)
            if fetched.get('error'):
                continue
            content = fetched['payload']['content_snippet']
            sections = parse_html(content)
            code = extract_code_blocks(content)
            summary = sections[0]['content'][:800] if sections else content[:800]
            results.append({"url": a, "summary": summary, "code_samples": code[:3]})
            key = a.replace('https://', '').replace('http://', '').replace('/', '_')[:80]
            self.memory.add(key, summary, {"source": a})
        return {"query": query, "results": results}

