import logging

from fastapi import APIRouter

from .schemas import GenerateRequest, GenerateResponse, SummarizeRequest, SummarizeResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    # TODO: implement LLM inference (Mistral)
    # Receives anonymized clinical text + PubMed articles (title, abstract, authors, doi)
    # Must return: summary, list of recommendations, list of exercises, evidence_level, sources, precautions
    logger.info(f"Generating response for text of length {len(request.anonymized_text)}")
    return GenerateResponse(
        summary="",
        recommendations=[],
        exercises=[],
        evidence_level="",
        sources=[],
        precautions=[],
    )


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(request: SummarizeRequest):
    # TODO: implement LLM inference (Mistral)
    # Receives the full anonymized session text (already processed by /generate)
    # Must return a single comprehensive summary of the session for the practitioner
    logger.info(f"Summarizing session text of length {len(request.anonymized_text)}")
    return SummarizeResponse(summary="")
