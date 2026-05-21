from typing import ClassVar

from pydantic import BaseModel, ConfigDict


class SearchRequest(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(
        json_schema_extra={"example": {"query": "arm pain", "max_results": 3}}
    )

    query: str
    max_results: int = 3


class Article(BaseModel):
    pmid: str
    title: str
    abstract: str
    authors: list[str]
    publication_date: str
    doi: str
