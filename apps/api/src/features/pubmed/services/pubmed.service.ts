import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseStringPromise } from 'xml2js';
import { ArticleResponseDto } from '../dtos/responses/article.response.dto';

const NCBI_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const NCBI_TOOL = 'medicail';
const NCBI_USER_AGENT = 'medicail/1.0';

@Injectable()
export class PubmedService {
  private readonly logger = new Logger(PubmedService.name);
  private readonly apiKey: string | undefined;
  private readonly email: string | undefined;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('NCBI_API_KEY') || undefined;
    this.email = config.get<string>('NCBI_EMAIL') || undefined;
  }

  async search(query: string, maxResults: number): Promise<ArticleResponseDto[]> {
    const pmids = await this.esearch(query, maxResults);
    if (pmids.length === 0) return [];
    return this.efetch(pmids);
  }

  private buildParams(base: Record<string, string | number>): URLSearchParams {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(base)) params.set(k, String(v));
    params.set('tool', NCBI_TOOL);
    if (this.email) params.set('email', this.email);
    if (this.apiKey) params.set('api_key', this.apiKey);
    return params;
  }

  private async ncbiFetch(url: string): Promise<Response> {
    return fetch(url, {
      headers: {
        'User-Agent': NCBI_USER_AGENT,
      },
    });
  }

  private async esearch(query: string, maxResults: number): Promise<string[]> {
    const params = this.buildParams({ db: 'pubmed', term: query, retmax: maxResults, retmode: 'json' });
    const res = await this.ncbiFetch(`${NCBI_BASE_URL}/esearch.fcgi?${params}`);
    if (!res.ok) {
      throw new BadGatewayException(`NCBI esearch error (${res.status})`);
    }

    const data = (await res.json()) as {
      esearchresult?: { idlist?: string[]; ERROR?: string; error?: string };
      error?: string;
    };

    const ncbiError = data.esearchresult?.ERROR ?? data.esearchresult?.error ?? data.error;
    if (ncbiError) {
      throw new BadGatewayException(`NCBI esearch error: ${ncbiError}`);
    }

    const pmids = data.esearchresult?.idlist ?? [];
    this.logger.log(`ESearch returned ${pmids.length} PMIDs for query: "${query}"`);
    return pmids;
  }

  private async efetch(pmids: string[]): Promise<ArticleResponseDto[]> {
    const params = this.buildParams({
      db: 'pubmed',
      id: pmids.join(','),
      rettype: 'abstract',
      retmode: 'xml',
    });
    const res = await this.ncbiFetch(`${NCBI_BASE_URL}/efetch.fcgi?${params}`);
    if (!res.ok) {
      throw new BadGatewayException(`NCBI efetch error (${res.status})`);
    }
    return this.parseArticles(await res.text());
  }

  private async parseArticles(xml: string): Promise<ArticleResponseDto[]> {
    let root: Record<string, unknown>;
    try {
      root = await parseStringPromise(xml, { explicitArray: true });
    } catch (err) {
      this.logger.error(`Failed to parse NCBI XML: ${err}`);
      return [];
    }

    const pubmedArticles: unknown[] = (root as { PubmedArticleSet?: { PubmedArticle?: unknown[] } })?.PubmedArticleSet?.PubmedArticle ?? [];

    const articles: ArticleResponseDto[] = [];
    for (const node of pubmedArticles) {
      try {
        articles.push(this.parseSingle(node as Record<string, unknown>));
      } catch (err) {
        this.logger.warn(`Skipping article: ${err}`);
      }
    }
    return articles;
  }

  private parseSingle(node: Record<string, unknown>): ArticleResponseDto {
    const medlineCitation = (node['MedlineCitation'] as Record<string, unknown>[])?.[0] ?? {};
    const article = (medlineCitation['Article'] as Record<string, unknown>[])?.[0] ?? {};

    const pmid = String(
      (medlineCitation['PMID'] as Record<string, unknown>[])?.[0]?.['_'] ?? (medlineCitation['PMID'] as Record<string, unknown>[])?.[0] ?? '',
    );

    const title = String((article['ArticleTitle'] as Record<string, unknown>[])?.[0]?.['_'] ?? (article['ArticleTitle'] as string[])?.[0] ?? '');

    const abstract = this.extractAbstract(article);
    const authors = this.extractAuthors(article);
    const publication_date = this.extractDate(medlineCitation);
    const doi = this.extractDoi(node);

    return { pmid, title, abstract, authors, publication_date, doi };
  }

  private extractAbstract(article: Record<string, unknown>): string {
    const abstractNode = (article['Abstract'] as Record<string, unknown>[])?.[0];
    if (!abstractNode) return '';
    const parts = (abstractNode['AbstractText'] as Record<string, unknown>[]) ?? [];
    return parts
      .map((p) => {
        const label = p['$'] ? (p['$'] as Record<string, string>)['Label'] : undefined;
        const text = String(p['_'] ?? p ?? '');
        return label ? `${label}: ${text}` : text;
      })
      .join(' ');
  }

  private extractAuthors(article: Record<string, unknown>): string[] {
    const authorList = (article['AuthorList'] as Record<string, unknown>[])?.[0];
    if (!authorList) return [];
    const authors = (authorList['Author'] as Record<string, unknown>[]) ?? [];
    return authors
      .map((a) => {
        const last = String((a['LastName'] as string[])?.[0] ?? '');
        const fore = String((a['ForeName'] as string[])?.[0] ?? '');
        return fore ? `${fore} ${last}`.trim() : last;
      })
      .filter(Boolean);
  }

  private extractDate(medlineCitation: Record<string, unknown>): string | null {
    const journal = ((medlineCitation['Article'] as Record<string, unknown>[])?.[0]?.['Journal'] as Record<string, unknown>[])?.[0] ?? {};
    const journalIssue = (journal['JournalIssue'] as Record<string, unknown>[])?.[0] ?? {};
    const pubDate = (journalIssue['PubDate'] as Record<string, unknown>[])?.[0] ?? {};
    return String((pubDate['Year'] as string[])?.[0] ?? '') || null;
  }

  private extractDoi(node: Record<string, unknown>): string | null {
    const pubmedData = (node['PubmedData'] as Record<string, unknown>[])?.[0] ?? {};
    const articleIdList = (pubmedData['ArticleIdList'] as Record<string, unknown>[])?.[0] ?? {};
    const ids = (articleIdList['ArticleId'] as Record<string, unknown>[]) ?? [];
    for (const loc of ids) {
      const idType = (loc['$'] as Record<string, string>)?.['IdType'];
      if (idType === 'doi') return String(loc['_'] ?? '');
    }
    return null;
  }
}
