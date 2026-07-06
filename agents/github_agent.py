"""GithubAgent: search GitHub via web and summarize repositories.

This agent is privacy-focused and performs web scraping of GitHub public pages.
For heavier usage, consider authenticating via the GitHub API with a token and
storing tokens securely.
"""
from typing import Dict, Any, List
from agents.scraper import Scraper
from agents.documentation_parser import parse_html
from utils.logger import get_logger

_LOG = get_logger(__name__)


class GithubAgent:
    def __init__(self, headless: bool = True):
        self.scraper = Scraper(headless=headless)

    async def search_repos(self, query: str, max_repos: int = 5) -> List[Dict[str, Any]]:
        # use GitHub search URL
        url = f"https://github.com/search?q={query.replace(' ', '+')}&type=repositories"
        sr = await self.scraper.fetch(url)
        if sr.get('error'):
            return []
        html = sr['payload']['content_snippet']
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        repos = []
        for a in soup.select('a.v-align-middle')[:max_repos]:
            href = a.get('href')
            repo_url = 'https://github.com' + href
            repos.append({'name': href.strip('/'), 'url': repo_url})
        # fetch readmes
        out = []
        for r in repos:
            rd = await self.scraper.fetch(r['url'])
            if rd.get('error'):
                continue
            content = rd['payload']['content_snippet']
            sections = parse_html(content)
            desc = sections[0]['content'][:600] if sections else ''
            out.append({'name': r['name'], 'url': r['url'], 'description': desc})
        return out

    async def close(self):
        await self.scraper.close()
