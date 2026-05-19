from pydantic import BaseModel


class SearchRequest(BaseModel):
    query: str
    max_results: int = 10


class Article(BaseModel):
    pmid: str
    title: str
    abstract: str
    authors: list[str]
    publication_date: str
    doi: str


class SearchResponse(BaseModel):
    articles: list[Article]
