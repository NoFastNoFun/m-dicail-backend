from pydantic import BaseModel


class AnonymizeRequest(BaseModel):
    text: str
    language: str = "fr"


class Entity(BaseModel):
    label: str
    original_value: str
    placeholder: str
    start: int
    end: int


class AnonymizeResponse(BaseModel):
    anonymized_text: str
    entities: list[Entity]
