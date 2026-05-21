import logging

from fastapi import APIRouter, HTTPException

from .client import search_pubmed
from .schemas import Article, SearchRequest

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/search", response_model=list[Article])
async def search(request: SearchRequest) -> list[Article]:
    logger.info(f"Searching PubMed for: {request.query!r} (max={request.max_results})")
    try:
        articles = await search_pubmed(request.query, request.max_results)
    except Exception as exc:
        logger.error(f"PubMed search failed: {exc}")
        raise HTTPException(status_code=502, detail="PubMed API unavailable")
    logger.info(f"Returning {len(articles)} articles")
    return articles
