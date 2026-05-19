import logging

from fastapi import APIRouter

from schemas import SearchRequest, SearchResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    # TODO: implement PubMed NCBI API integration
    logger.info(f"Searching PubMed for: {request.query}")
    return SearchResponse(articles=[])
