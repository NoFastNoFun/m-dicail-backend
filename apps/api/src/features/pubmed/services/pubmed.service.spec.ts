import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PubmedService } from './pubmed.service';

const sampleXml = `<?xml version="1.0"?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>12345</PMID>
      <Article>
        <ArticleTitle>Sample Article</ArticleTitle>
        <Abstract>
          <AbstractText>Abstract body</AbstractText>
        </Abstract>
        <AuthorList>
          <Author><LastName>Doe</LastName><ForeName>John</ForeName></Author>
        </AuthorList>
        <Journal>
          <JournalIssue>
            <PubDate><Year>2024</Year></PubDate>
          </JournalIssue>
        </Journal>
      </Article>
    </MedlineCitation>
    <PubmedData>
      <ArticleIdList>
        <ArticleId IdType="doi">10.1000/example</ArticleId>
      </ArticleIdList>
    </PubmedData>
  </PubmedArticle>
</PubmedArticleSet>`;

describe('PubmedService', () => {
  let service: PubmedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PubmedService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-api-key') },
        },
      ],
    }).compile();

    service = module.get(PubmedService);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty array when no PMIDs are found', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ esearchresult: { idlist: [] } }),
    });

    const result = await service.search('query', 10);

    expect(result).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns parsed articles when PMIDs are found', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ esearchresult: { idlist: ['12345'] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => sampleXml,
      });

    const result = await service.search('query', 10);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      pmid: '12345',
      title: 'Sample Article',
      abstract: 'Abstract body',
      authors: ['John Doe'],
      publication_date: '2024',
      doi: '10.1000/example',
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws BadGatewayException when esearch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    await expect(service.search('query', 10)).rejects.toThrow(BadGatewayException);
  });

  it('throws BadGatewayException when efetch fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ esearchresult: { idlist: ['12345'] } }),
      })
      .mockResolvedValueOnce({ ok: false });

    await expect(service.search('query', 10)).rejects.toThrow(BadGatewayException);
  });

  it('returns empty array when XML parsing fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ esearchresult: { idlist: ['12345'] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'not-xml',
      });

    const result = await service.search('query', 10);

    expect(result).toEqual([]);
  });

  it('parses abstract sections with labels and authors without forename', async () => {
    const richXml = `<?xml version="1.0"?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>99</PMID>
      <Article>
        <ArticleTitle>Rich Article</ArticleTitle>
        <Abstract>
          <AbstractText Label="BACKGROUND">Background text</AbstractText>
        </Abstract>
        <AuthorList>
          <Author><LastName>Solo</LastName></Author>
        </AuthorList>
        <Journal><JournalIssue><PubDate/></JournalIssue></Journal>
      </Article>
    </MedlineCitation>
    <PubmedData><ArticleIdList/></PubmedData>
  </PubmedArticle>
</PubmedArticleSet>`;

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ esearchresult: { idlist: ['99'] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => richXml,
      });

    const result = await service.search('query', 1);

    expect(result[0].abstract).toBe('BACKGROUND: Background text');
    expect(result[0].authors).toEqual(['Solo']);
    expect(result[0].publication_date).toBeNull();
    expect(result[0].doi).toBeNull();
  });
});
