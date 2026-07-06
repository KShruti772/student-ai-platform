"""Parse documentation HTML into structured sections.

Extracts headings, paragraphs, and code blocks to create a concise summary
that can be fed to an LLM for summarization or indexed for RAG.
"""
from bs4 import BeautifulSoup
from typing import List, Dict

from utils.logger import get_logger

_LOG = get_logger(__name__)


def parse_html(html: str) -> List[Dict[str, str]]:
    """Return a list of sections with `title` and `content`."""
    soup = BeautifulSoup(html, "html.parser")
    out = []
    # Collect headings and following paragraphs
    for h in soup.find_all(["h1", "h2", "h3"]):
        title = h.get_text().strip()
        content_parts = []
        for sib in h.find_next_siblings():
            if sib.name and sib.name.startswith('h'):
                break
            text = sib.get_text().strip()
            if text:
                content_parts.append(text)
        out.append({"title": title, "content": "\n\n".join(content_parts)})
    # If no headings found, fallback to body text
    if not out:
        body = soup.body.get_text(separator='\n') if soup.body else soup.get_text(separator='\n')
        out.append({"title": "document", "content": body.strip()[:2000]})
    return out


def extract_code_blocks(html: str) -> List[str]:
    soup = BeautifulSoup(html, "html.parser")
    blocks = [c.get_text() for c in soup.find_all("pre")]
    return blocks
