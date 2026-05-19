import logging

from fastapi import APIRouter

from .schemas import ReportRequest, ReportResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=ReportResponse)
async def generate(request: ReportRequest):
    # TODO: implement report/PDF generation
    logger.info(f"Generating {request.format} report for session {request.session_id}")
    return ReportResponse(
        session_id=request.session_id,
        report_data="",
        format=request.format,
        filename=f"report_{request.session_id}.{request.format}",
    )
