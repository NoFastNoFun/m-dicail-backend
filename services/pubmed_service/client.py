import logging
import xml.etree.ElementTree as ET

import httpx

from .config import NCBI_API_KEY, NCBI_BASE_URL
from .schemas import Article

logger = logging.getLogger(__name__)

_ESEARCH_URL = f"{NCBI_BASE_URL}/esearch.fcgi"
_EFETCH_URL = f"{NCBI_BASE_URL}/efetch.fcgi"


def _build_params(base: dict[str, str | int]) -> dict[str, str | int]:
    if NCBI_API_KEY:
        base["api_key"] = NCBI_API_KEY
    return base


async def search_pubmed(query: str, max_results: int) -> list[Article]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        pmids = await _esearch(client, query, max_results)
        if not pmids:
            return []
        return await _efetch(client, pmids)


async def _esearch(
    client: httpx.AsyncClient, query: str, max_results: int
) -> list[str]:
    params = _build_params(
        {
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "retmode": "json",
        }
    )
    response = await client.get(_ESEARCH_URL, params=params)
    response.raise_for_status()
    data = response.json()
    pmids: list[str] = data.get("esearchresult", {}).get("idlist", [])
    logger.info(f"ESearch returned {len(pmids)} PMIDs for query: {query!r}")
    return pmids


async def _efetch(client: httpx.AsyncClient, pmids: list[str]) -> list[Article]:
    params = _build_params(
        {
            "db": "pubmed",
            "id": ",".join(pmids),
            "rettype": "abstract",
            "retmode": "xml",
        }
    )
    response = await client.get(_EFETCH_URL, params=params)
    response.raise_for_status()
    return _parse_articles(response.text)


def _parse_articles(xml_text: str) -> list[Article]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        logger.error(f"Failed to parse NCBI XML response: {exc}")
        return []
    articles: list[Article] = []

    for article_node in root.findall(".//PubmedArticle"):
        try:
            articles.append(_parse_single(article_node))
        except (KeyError, AttributeError, ET.ParseError) as exc:
            pmid = article_node.findtext(".//PMID", default="?")
            logger.warning(f"Skipping PMID {pmid}: {exc}")

    return articles


def _parse_single(node: ET.Element) -> Article:
    pmid = node.findtext(".//PMID") or ""
    title = node.findtext(".//ArticleTitle") or ""
    abstract = _extract_abstract(node)
    authors = _extract_authors(node)
    publication_date = _extract_date(node)
    doi = _extract_doi(node)

    return Article(
        pmid=pmid,
        title=title,
        abstract=abstract,
        authors=authors,
        publication_date=publication_date,
        doi=doi,
    )


def _extract_abstract(node: ET.Element) -> str:
    parts = node.findall(".//AbstractText")
    if not parts:
        return ""
    segments: list[str] = []
    for part in parts:
        label: str | None = part.get("Label")
        text = part.text or ""
        segments.append(f"{label}: {text}" if label else text)
    return " ".join(segments)


def _extract_authors(node: ET.Element) -> list[str]:
    authors: list[str] = []
    for author in node.findall(".//Author"):
        last = author.findtext("LastName") or ""
        fore = author.findtext("ForeName") or ""
        name = f"{fore} {last}".strip() if fore else last
        if name:
            authors.append(name)
    return authors


def _extract_date(node: ET.Element) -> str | None:
    pub_date = node.find(".//PubDate")
    if pub_date is None:
        return None
    return pub_date.findtext("Year") or None


def _extract_doi(node: ET.Element) -> str | None:
    for loc in node.findall(".//ELocationID"):
        if loc.get("EIdType") == "doi":
            return loc.text or None
    for loc in node.findall(".//ArticleId"):
        if loc.get("IdType") == "doi":
            return loc.text or None
    return None
