import logging

from fastapi import APIRouter

from .schemas import GenerateRequest, GenerateResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    # TODO: implement LLM inference (Mistral)
    logger.info(f"Generating response for text of length {len(request.anonymized_text)}")
    return GenerateResponse(
        summary="",
        recommendations=[],
        exercises=[],
        evidence_level="",
        sources=[],
        precautions=[],
    )
