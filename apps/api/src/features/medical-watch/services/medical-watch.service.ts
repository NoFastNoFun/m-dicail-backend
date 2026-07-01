import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PubmedService } from '../../pubmed/services/pubmed.service';
import { MedicalWatchRepository } from '../repositories/medical-watch.repository';
import { MedicalWatchArticle } from '../entities/medical-watch-article.entity';
import { MedicalWatchSpecialty } from '../enums/medical-watch-specialty.enum';

const WATCH_QUERIES: Record<MedicalWatchSpecialty, string> = {
  [MedicalWatchSpecialty.REHABILITATION]: 'physiotherapy rehabilitation',
  [MedicalWatchSpecialty.MUSCULOSKELETAL]: 'musculoskeletal physical therapy',
  [MedicalWatchSpecialty.EXERCISE_THERAPY]: 'exercise therapy evidence',
  [MedicalWatchSpecialty.MANUAL_THERAPY]: 'manual therapy randomized controlled trial',
};

@Injectable()
export class MedicalWatchService {
  private readonly logger = new Logger(MedicalWatchService.name);

  constructor(
    private readonly pubmedService: PubmedService,
    private readonly repository: MedicalWatchRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailyWatch(): Promise<void> {
    this.logger.log('Starting daily medical watch...');
    for (const specialty of Object.values(MedicalWatchSpecialty)) {
      await this.fetchAndStore(specialty);
    }
    this.logger.log('Daily medical watch completed.');
  }

  async runManually(): Promise<void> {
    for (const specialty of Object.values(MedicalWatchSpecialty)) {
      await this.fetchAndStore(specialty);
    }
  }

  getArticles(specialty?: MedicalWatchSpecialty, limit?: number): Promise<MedicalWatchArticle[]> {
    return this.repository.findAll(specialty, limit);
  }

  private async fetchAndStore(specialty: MedicalWatchSpecialty): Promise<void> {
    const query = WATCH_QUERIES[specialty];
    try {
      const articles = await this.pubmedService.search(query, 10);
      const entities = articles.map((a) => ({
        pmid: a.pmid,
        specialty,
        title: a.title,
        abstract: a.abstract,
        authors: a.authors,
        publicationDate: a.publication_date,
        doi: a.doi,
        searchQuery: query,
      }));
      await this.repository.upsertArticles(entities);
      this.logger.log(`Stored ${entities.length} articles for specialty: "${specialty}"`);
    } catch (err) {
      this.logger.error(`Failed for specialty "${specialty}": ${err}`);
    }
  }
}
