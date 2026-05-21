from pydantic import BaseModel


class ProtocolResponse(BaseModel):
    id: int
    pathology: str
    phase: str
    title: str
    description: str
    source: str
    publication_year: int
    evidence_level: str | None

    model_config = {"from_attributes": True}


class ProtocolListResponse(BaseModel):
    protocols: list[ProtocolResponse]
    total: int
