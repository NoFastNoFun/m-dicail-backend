import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PubmedService } from '../../pubmed/services/pubmed.service';
import { MedicalWatchRepository } from '../repositories/medical-watch.repository';
import { MedicalWatchArticle } from '../entities/medical-watch-article.entity';

const WATCH_QUERIES = [
  'physiotherapy rehabilitation',
  'musculoskeletal physical therapy',
  'exercise therapy evidence',
  'manual therapy randomized controlled trial',
];

@Injectable()
export class MedicalWatchService {
  private readonly logger = new Logger(MedicalWatchService.name);

  constructor(
    private readonly pubmedService: PubmedService,
    private readonly repository: MedicalWatchRepository,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async runWeeklyWatch(): Promise<void> {
    this.logger.log('Starting weekly medical watch...');
    for (const query of WATCH_QUERIES) {
      await this.fetchAndStore(query);
    }
    this.logger.log('Weekly medical watch completed.');
  }

  async runManually(): Promise<void> {
    for (const query of WATCH_QUERIES) {
      await this.fetchAndStore(query);
    }
  }

  getArticles(limit?: number): Promise<MedicalWatchArticle[]> {
    return this.repository.findAll(limit);
  }

  private async fetchAndStore(query: string): Promise<void> {
    try {
      const articles = await this.pubmedService.search(query, 10);
      const entities = articles.map((a) => ({
        pmid: a.pmid,
        title: a.title,
        abstract: a.abstract,
        authors: a.authors,
        publicationDate: a.publication_date,
        doi: a.doi,
        searchQuery: query,
      }));
      await this.repository.upsertArticles(entities);
      this.logger.log(`Stored ${entities.length} articles for query: "${query}"`);
    } catch (err) {
      this.logger.error(`Failed for query "${query}": ${err}`);
    }
  }
}
