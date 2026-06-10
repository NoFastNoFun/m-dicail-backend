from pydantic import BaseModel, ConfigDict, Field


class SearchRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"example": {"query": "arm pain", "max_results": 3}}
    )

    query: str
    max_results: int = Field(default=3, ge=1, le=50)


class Article(BaseModel):
    pmid: str
    title: str
    abstract: str
    authors: list[str]
    publication_date: str | None = None
    doi: str | None = None
