import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '@features/users/services/users.service';
import { MailService } from '../../mail/services/mail.service';
import { PubmedService } from '../../pubmed/services/pubmed.service';
import { MedicalWatchRepository } from '../repositories/medical-watch.repository';
import { MedicalWatchSpecialty } from '../enums/medical-watch-specialty.enum';
import { MedicalWatchArticleResponseDto } from '../dtos/responses/medical-watch-article.response.dto';
import { MedicalWatchPreferencesResponseDto } from '../dtos/requests/medical-watch-preferences.request.dto';

const WATCH_QUERIES: Record<MedicalWatchSpecialty, string> = {
  [MedicalWatchSpecialty.REHABILITATION]: 'physiotherapy rehabilitation',
  [MedicalWatchSpecialty.MUSCULOSKELETAL]: 'musculoskeletal physical therapy',
  [MedicalWatchSpecialty.EXERCISE_THERAPY]: 'exercise therapy evidence',
  [MedicalWatchSpecialty.MANUAL_THERAPY]: 'manual therapy randomized controlled trial',
};

@Injectable()
export class MedicalWatchService implements OnModuleInit {
  private readonly logger = new Logger(MedicalWatchService.name);

  constructor(
    private readonly pubmedService: PubmedService,
    private readonly repository: MedicalWatchRepository,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  onModuleInit(): void {
    // Fire-and-forget seed so boot is not blocked on PubMed.
    void this.seedIfEmpty();
  }

  /** Midnight Europe/Paris: refresh PubMed articles for every specialty. */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Europe/Paris' })
  async runDailyWatch(): Promise<void> {
    this.logger.log('Starting daily medical watch...');
    for (const specialty of Object.values(MedicalWatchSpecialty)) {
      await this.fetchAndStore(specialty);
    }
    this.logger.log('Daily medical watch completed.');
  }

  /** 07:00 Europe/Paris digest email — not implemented yet (opt-in users only). */
  @Cron('0 7 * * *', { timeZone: 'Europe/Paris' })
  async sendDailyDigest(): Promise<void> {
    const optedInUsers = await this.usersService.findDigestOptInUsers();
    this.logger.log(`TODO: medical watch digest email for ${optedInUsers.length} opted-in user(s) — not implemented yet`);
    void this.mailService;
  }

  async getPreferences(userId: string): Promise<MedicalWatchPreferencesResponseDto> {
    const user = await this.usersService.findById(userId);
    return { digestOptIn: user?.medicalWatchDigestOptIn ?? false };
  }

  async updatePreferences(userId: string, digestOptIn: boolean): Promise<MedicalWatchPreferencesResponseDto> {
    const user = await this.usersService.updateDigestOptIn(userId, digestOptIn);
    return { digestOptIn: user.medicalWatchDigestOptIn };
  }

  async runManually(): Promise<void> {
    for (const specialty of Object.values(MedicalWatchSpecialty)) {
      await this.fetchAndStore(specialty);
    }
  }

  async getArticles(specialty?: MedicalWatchSpecialty, limit?: number): Promise<MedicalWatchArticleResponseDto[]> {
    const articles = await this.repository.findAll(specialty, limit);
    return articles.map((a) => new MedicalWatchArticleResponseDto(a));
  }

  private async seedIfEmpty(): Promise<void> {
    try {
      const count = await this.repository.count();
      if (count > 0) return;
      this.logger.log('Medical watch table empty — seeding from PubMed...');
      await this.runManually();
    } catch (err) {
      this.logger.error(`Failed to seed medical watch on startup: ${err}`);
    }
  }

  private async fetchAndStore(specialty: MedicalWatchSpecialty): Promise<void> {
    const query = WATCH_QUERIES[specialty];
    try {
      const articles = await this.pubmedService.search(query, 10);
      if (articles.length === 0) {
        this.logger.warn(`No articles returned for specialty: "${specialty}"`);
        return;
      }
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
