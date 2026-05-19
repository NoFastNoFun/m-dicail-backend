import logging

from fastapi import APIRouter

from .schemas import AnonymizeRequest, AnonymizeResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/anonymize", response_model=AnonymizeResponse)
async def anonymize(request: AnonymizeRequest):
    # TODO: implement NER-based PII anonymization
    logger.info(f"Anonymizing text of length {len(request.text)}")
    return AnonymizeResponse(anonymized_text=request.text, entities=[])
