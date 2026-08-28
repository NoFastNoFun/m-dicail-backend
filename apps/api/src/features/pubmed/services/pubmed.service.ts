import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseStringPromise } from 'xml2js';
import { MeshDescriptorResponseDto } from '../dtos/responses/mesh-descriptor.response.dto';
import { ArticleResponseDto } from '../dtos/responses/article.response.dto';

const NCBI_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const NCBI_TOOL = 'medicail';
const NCBI_USER_AGENT = 'medicail/1.0';
const MESH_THERAPY_QUALIFIERS = new Set(['rehabilitation', 'therapy', 'physiopathology', 'diet therapy']);

interface MeshCandidate {
  mesh_ui: string;
  term: string;
  synonyms: string[];
  tree_numbers: string[];
  count?: number;
}

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
    const pmids = await this.esearch('pubmed', query, maxResults);
    if (pmids.length === 0) return [];
    return this.efetch(pmids);
  }

  async searchMesh(query: string, maxResults: number): Promise<MeshDescriptorResponseDto[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const meshResults = await this.searchMeshDatabase(trimmed, maxResults);
    if (meshResults.length > 0) {
      return meshResults.slice(0, maxResults);
    }

    const fallbackResults = await this.searchMeshFromPubmedArticles(trimmed, maxResults);
    return fallbackResults.slice(0, maxResults);
  }

  private async searchMeshDatabase(query: string, maxResults: number): Promise<MeshDescriptorResponseDto[]> {
    const ids = await this.esearch('mesh', query, maxResults);
    if (ids.length === 0) {
      return [];
    }
    return this.meshEsummary(ids);
  }

  private async searchMeshFromPubmedArticles(query: string, maxResults: number): Promise<MeshDescriptorResponseDto[]> {
    const pubmedQuery = `"${query.replace(/"/g, '')}" AND ("Physical Therapy Modalities"[Mesh] OR physiotherapy[Title/Abstract])`;
    const pmids = await this.esearch('pubmed', pubmedQuery, 20);
    if (pmids.length === 0) {
      return [];
    }

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

    const aggregated = await this.extractMeshFromPubmedXml(await res.text());
    return aggregated
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
      .slice(0, maxResults)
      .map(({ count: _count, ...descriptor }) => descriptor);
  }

  private async meshEsummary(ids: string[]): Promise<MeshDescriptorResponseDto[]> {
    const params = this.buildParams({
      db: 'mesh',
      id: ids.join(','),
      retmode: 'json',
    });
    const res = await this.ncbiFetch(`${NCBI_BASE_URL}/esummary.fcgi?${params}`);
    if (!res.ok) {
      throw new BadGatewayException(`NCBI esummary error (${res.status})`);
    }

    const data = (await res.json()) as {
      result?: {
        uids?: string[];
        ERROR?: string;
        error?: string;
        [uid: string]: unknown;
      };
      error?: string;
    };

    const result = data.result ?? {};
    const ncbiError = (result.ERROR as string | undefined) ?? (result.error as string | undefined) ?? data.error;
    if (ncbiError) {
      throw new BadGatewayException(`NCBI esummary error: ${ncbiError}`);
    }

    const uids = result.uids ?? [];
    const descriptors: MeshDescriptorResponseDto[] = [];

    for (const uid of uids) {
      const record = result[uid];
      if (!record || typeof record !== 'object') {
        continue;
      }
      const parsed = this.parseMeshSummaryRecord(record as Record<string, unknown>);
      if (parsed && this.isDiseaseDescriptor(parsed.tree_numbers)) {
        descriptors.push(parsed);
      }
    }

    return descriptors;
  }

  private parseMeshSummaryRecord(record: Record<string, unknown>): MeshDescriptorResponseDto | null {
    const meshUi = this.readMeshField(record, ['ds_meshui', 'DS_MeshUI', 'meshui']);
    const term = this.readMeshField(record, ['ds_meshname', 'DS_MeshName', 'meshname', 'title']);
    if (!meshUi || !term) {
      return null;
    }

    const treeRaw = this.readMeshField(record, ['ds_treenumbers', 'DS_TreeNumbers', 'treenumbers']);
    const treeNumbers = treeRaw
      ? treeRaw
          .split(/[;,]/)
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

    const synonyms = this.extractMeshSynonyms(record, term);
    return {
      mesh_ui: meshUi,
      term,
      synonyms,
      tree_numbers: treeNumbers,
    };
  }

  private readMeshField(record: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const direct = record[key];
      if (typeof direct === 'string' && direct.trim()) {
        return direct.trim();
      }
      const lower = record[key.toLowerCase()];
      if (typeof lower === 'string' && lower.trim()) {
        return lower.trim();
      }
    }
    return '';
  }

  private extractMeshSynonyms(record: Record<string, unknown>, term: string): string[] {
    const synonyms = new Set<string>();
    const conceptList = record['ds_conceptlist'] ?? record['DS_ConceptList'];
    if (Array.isArray(conceptList)) {
      for (const concept of conceptList) {
        if (!concept || typeof concept !== 'object') {
          continue;
        }
        const conceptRecord = concept as Record<string, unknown>;
        const terms = conceptRecord['terms'] ?? conceptRecord['Terms'];
        if (Array.isArray(terms)) {
          for (const item of terms) {
            if (typeof item === 'string' && item.trim() && item.trim() !== term) {
              synonyms.add(item.trim());
            }
          }
        }
      }
    }
    return [...synonyms];
  }

  private async extractMeshFromPubmedXml(xml: string): Promise<MeshCandidate[]> {
    let root: Record<string, unknown>;
    try {
      root = (await parseStringPromise(xml, { explicitArray: true })) as Record<string, unknown>;
    } catch (err) {
      this.logger.error(`Failed to parse PubMed MeSH XML: ${err}`);
      return [];
    }

    const pubmedArticles: unknown[] =
      (root as { PubmedArticleSet?: { PubmedArticle?: unknown[] } })?.PubmedArticleSet?.PubmedArticle ?? [];

    const counts = new Map<string, MeshCandidate>();

    for (const node of pubmedArticles) {
      const medlineCitation = ((node as Record<string, unknown>)['MedlineCitation'] as Record<string, unknown>[])?.[0] ?? {};
      const meshHeadingList = (medlineCitation['MeshHeadingList'] as Record<string, unknown>[])?.[0] ?? {};
      const headings = (meshHeadingList['MeshHeading'] as Record<string, unknown>[]) ?? [];

      for (const heading of headings) {
        const descriptorNode = (heading['DescriptorName'] as Record<string, unknown>[])?.[0];
        const term = String(descriptorNode?.['_'] ?? descriptorNode ?? '').trim();
        if (!term) {
          continue;
        }

        const qualifiers = (heading['QualifierName'] as Record<string, unknown>[]) ?? [];
        const qualifierTexts = qualifiers
          .map((qualifier) => String(qualifier?.['_'] ?? qualifier ?? '').trim().toLowerCase())
          .filter(Boolean);

        const hasTherapyQualifier =
          qualifierTexts.length === 0 ||
          qualifierTexts.some((qualifier) => MESH_THERAPY_QUALIFIERS.has(qualifier));
        if (!hasTherapyQualifier) {
          continue;
        }

        const ui = String(descriptorNode?.['$']?.['UI'] ?? '').trim();
        const key = ui || term.toLowerCase();
        const existing = counts.get(key);
        if (existing) {
          existing.count = (existing.count ?? 0) + 1;
          continue;
        }

        counts.set(key, {
          mesh_ui: ui || key,
          term,
          synonyms: [],
          tree_numbers: [],
          count: 1,
        });
      }
    }

    return [...counts.values()];
  }

  private isDiseaseDescriptor(treeNumbers: string[]): boolean {
    if (treeNumbers.length === 0) {
      return true;
    }
    return treeNumbers.some((treeNumber) => /^C/i.test(treeNumber.trim()));
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

  private async esearch(db: string, query: string, maxResults: number): Promise<string[]> {
    const params = this.buildParams({ db, term: query, retmax: maxResults, retmode: 'json' });
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

    const ids = data.esearchresult?.idlist ?? [];
    this.logger.log(`ESearch(${db}) returned ${ids.length} IDs for query: "${query}"`);
    return ids;
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
