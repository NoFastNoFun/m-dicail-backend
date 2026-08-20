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
  let configGet: jest.Mock;

  beforeEach(async () => {
    configGet = jest.fn((key: string) => {
      if (key === 'NCBI_API_KEY') return 'test-api-key';
      if (key === 'NCBI_EMAIL') return 'dev@medicail.test';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PubmedService,
        {
          provide: ConfigService,
          useValue: { get: configGet },
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

  it('sends User-Agent and NCBI identification params', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ esearchresult: { idlist: [] } }),
    });

    await service.search('query', 10);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('tool=medicail'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': 'medicail/1.0' }),
      }),
    );
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('email=dev%40medicail.test');
    expect(url).toContain('api_key=test-api-key');
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
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 403 });

    await expect(service.search('query', 10)).rejects.toThrow(BadGatewayException);
  });

  it('throws BadGatewayException when NCBI returns an ERROR field', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ esearchresult: { ERROR: 'API rate limit exceeded' } }),
    });

    await expect(service.search('query', 10)).rejects.toThrow(/API rate limit exceeded/);
  });

  it('throws BadGatewayException when efetch fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ esearchresult: { idlist: ['12345'] } }),
      })
      .mockResolvedValueOnce({ ok: false, status: 500 });

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
