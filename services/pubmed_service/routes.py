import logging

from fastapi import APIRouter, HTTPException

from .clean_text_logic.text_utils import clean_text_for_query
from .client import search_pubmed
from .schemas import Article, SearchRequest

logger = logging.getLogger(__name__)

router = APIRouter(tags=["PubMed"])


@router.post("/search", response_model=list[Article])
async def search(request: SearchRequest) -> list[Article]:
    keywords = clean_text_for_query(request.query)
    if not keywords:
        return []
    query = " ".join(keywords)
    logger.info(f"Searching PubMed (max={request.max_results})")
    try:
        articles = await search_pubmed(query, request.max_results)
    except Exception:
        logger.exception("PubMed search failed")
        raise HTTPException(status_code=502, detail="PubMed API unavailable")
    logger.info(f"Returning {len(articles)} articles")
    return articles
