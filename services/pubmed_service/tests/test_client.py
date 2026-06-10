import xml.etree.ElementTree as ET

import pytest
import respx
from httpx import Response

from ..client import (
    _extract_abstract,
    _extract_authors,
    _extract_date,
    _extract_doi,
    _parse_articles,
    search_pubmed,
)

# Mocked XML and JSON responses for testing

ARTICLE_XML = """
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>12345678</PMID>
      <Article>
        <ArticleTitle>Diabetes type 2 and insulin resistance</ArticleTitle>
        <Abstract>
          <AbstractText Label="Background">High blood sugar levels.</AbstractText>
          <AbstractText Label="Conclusion">Treatment improves outcomes.</AbstractText>
        </Abstract>
        <AuthorList>
          <Author>
            <LastName>Smith</LastName>
            <ForeName>John</ForeName>
          </Author>
          <Author>
            <LastName>Dupont</LastName>
            <ForeName>Marie</ForeName>
          </Author>
        </AuthorList>
      </Article>
      <MedlineJournalInfo/>
    </MedlineCitation>
    <PubmedData>
      <ArticleIdList>
        <ArticleId IdType="doi">10.1056/example</ArticleId>
      </ArticleIdList>
      <History>
        <PubMedPubDate PubStatus="pubmed">
          <PubDate>
            <Year>2023</Year>
            <Month>Jun</Month>
          </PubDate>
        </PubMedPubDate>
      </History>
    </PubmedData>
  </PubmedArticle>
</PubmedArticleSet>
"""

ESEARCH_JSON = {
    "esearchresult": {
        "idlist": ["12345678", "87654321"],
    }
}


def _node(xml: str) -> ET.Element:
    return ET.fromstring(xml)


# Tests


def test_extract_abstract_with_labels() -> None:
    node = _node("""
        <Article>
          <Abstract>
            <AbstractText Label="Background">High blood sugar.</AbstractText>
            <AbstractText Label="Conclusion">Treatment works.</AbstractText>
          </Abstract>
        </Article>
    """)
    result = _extract_abstract(node)
    assert "Background: High blood sugar." in result
    assert "Conclusion: Treatment works." in result


def test_extract_abstract_without_labels() -> None:
    node = _node("""
        <Article>
          <Abstract>
            <AbstractText>Simple abstract text.</AbstractText>
          </Abstract>
        </Article>
    """)
    assert _extract_abstract(node) == "Simple abstract text."


def test_extract_abstract_missing() -> None:
    node = _node("<Article/>")
    assert _extract_abstract(node) == ""


def test_extract_authors() -> None:
    node = _node("""
        <Article>
          <AuthorList>
            <Author><LastName>Smith</LastName><ForeName>John</ForeName></Author>
            <Author><LastName>Dupont</LastName><ForeName>Marie</ForeName></Author>
          </AuthorList>
        </Article>
    """)
    authors = _extract_authors(node)
    assert authors == ["John Smith", "Marie Dupont"]


def test_extract_authors_lastname_only() -> None:
    node = _node("""
        <Article>
          <AuthorList>
            <Author><LastName>Smith</LastName></Author>
          </AuthorList>
        </Article>
    """)
    assert _extract_authors(node) == ["Smith"]


def test_extract_authors_empty() -> None:
    node = _node("<Article/>")
    assert _extract_authors(node) == []


def test_extract_date_year_and_month() -> None:
    node = _node("<root><PubDate><Year>2023</Year><Month>Jun</Month></PubDate></root>")
    assert _extract_date(node) == "2023"


def test_extract_date_year_only() -> None:
    node = _node("<root><PubDate><Year>2023</Year></PubDate></root>")
    assert _extract_date(node) == "2023"


def test_extract_date_missing() -> None:
    node = _node("<root/>")
    assert _extract_date(node) is None


def test_extract_doi_present() -> None:
    node = _node("""
        <root>
          <ELocationID EIdType="doi">10.1056/example</ELocationID>
        </root>
    """)
    assert _extract_doi(node) == "10.1056/example"


def test_extract_doi_absent() -> None:
    node = _node("<root/>")
    assert _extract_doi(node) == ""


def test_parse_articles_returns_list() -> None:
    articles = _parse_articles(ARTICLE_XML)
    assert len(articles) == 1
    article = articles[0]
    assert article.pmid == "12345678"
    assert article.title == "Diabetes type 2 and insulin resistance"
    assert "Background" in article.abstract
    assert "John Smith" in article.authors
    assert article.doi == "10.1056/example"


def test_parse_articles_empty_xml() -> None:
    articles = _parse_articles("<PubmedArticleSet/>")
    assert articles == []


# Tests HTTP


@pytest.mark.anyio
@respx.mock
async def test_search_pubmed_returns_articles() -> None:
    _ = respx.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi").mock(
        return_value=Response(200, json=ESEARCH_JSON)
    )
    _ = respx.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi").mock(
        return_value=Response(200, text=ARTICLE_XML)
    )

    articles = await search_pubmed("diabetes type 2", max_results=5)
    assert len(articles) == 1
    assert articles[0].pmid == "12345678"


@pytest.mark.anyio
@respx.mock
async def test_search_pubmed_no_results() -> None:
    _ = respx.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi").mock(
        return_value=Response(200, json={"esearchresult": {"idlist": []}})
    )

    articles = await search_pubmed("xyznotaquery", max_results=5)
    assert articles == []
