from pydantic import BaseModel


class ReportRequest(BaseModel):
    session_id: str
    content: str
    format: str = "text"


class ReportResponse(BaseModel):
    session_id: str
    report_data: str
    format: str
    filename: str
