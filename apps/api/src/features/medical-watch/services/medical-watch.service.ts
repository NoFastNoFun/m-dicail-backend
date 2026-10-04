import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '@features/users/services/users.service';
import { PubmedService } from '../../pubmed/services/pubmed.service';
import { PushService } from '../../push/services/push.service';
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

/** Only fetch articles published in the last N days, so each nightly run brings recent work. */
const WATCH_RECENT_DAYS = 2;

@Injectable()
export class MedicalWatchService implements OnModuleInit {
  private readonly logger = new Logger(MedicalWatchService.name);

  constructor(
    private readonly pubmedService: PubmedService,
    private readonly repository: MedicalWatchRepository,
    private readonly usersService: UsersService,
    private readonly pushService: PushService,
  ) {}

  onModuleInit(): void {
    // Fire-and-forget seed so boot is not blocked on PubMed.
    void this.seedIfEmpty();
  }

  /** Midnight Europe/Paris: refresh PubMed articles for every specialty. */
  // Europe/Paris: practitioners expect overnight refresh before morning clinic hours.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Europe/Paris' })
  async runDailyWatch(): Promise<void> {
    this.logger.log('Starting daily medical watch...');
    for (const specialty of Object.values(MedicalWatchSpecialty)) {
      await this.fetchAndStore(specialty);
    }
    this.logger.log('Daily medical watch completed.');
  }

  /** 07:00 Europe/Paris: FCM digest to opted-in users when new articles were fetched today. */
  @Cron('0 7 * * *', { timeZone: 'Europe/Paris' })
  async sendDailyDigest(): Promise<void> {
    const optedInUsers = await this.usersService.findDigestOptInUsers();
    if (optedInUsers.length === 0) {
      this.logger.log('No opted-in users — skipping FCM digest');
      return;
    }

    const count = await this.repository.countFetchedSince(this.startOfTodayParis());
    if (count === 0) {
      this.logger.log('No new medical-watch articles today — skipping FCM digest');
      return;
    }

    const body = count === 1 ? '1 nouvel article disponible' : `${count} nouveaux articles disponibles`;

    await this.pushService.sendToUsers(
      optedInUsers.map((u) => u.id),
      {
        title: 'Veille scientifique',
        body,
        data: {
          type: 'medical_watch',
          count: String(count),
        },
      },
    );
    this.logger.log(`FCM medical-watch digest sent to ${optedInUsers.length} opted-in user(s) for ${count} new article(s)`);
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
      const articles = await this.pubmedService.search(query, 10, { recentDays: WATCH_RECENT_DAYS });
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

  /** Start of calendar day in Europe/Paris, as a UTC Date for SQL comparison. */
  private startOfTodayParis(): Date {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const year = Number(parts.find((p) => p.type === 'year')!.value);
    const month = Number(parts.find((p) => p.type === 'month')!.value);
    const day = Number(parts.find((p) => p.type === 'day')!.value);

    // At 12:00 UTC on that calendar day, Paris hour reveals the UTC offset.
    const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const parisHour = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris',
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(probe),
    );
    const offsetHours = parisHour - 12;
    return new Date(Date.UTC(year, month - 1, day, -offsetHours, 0, 0, 0));
  }
}
