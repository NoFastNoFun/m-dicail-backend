import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalWatchArticle } from '../entities/medical-watch-article.entity';
import { MedicalWatchSpecialty } from '../enums/medical-watch-specialty.enum';

@Injectable()
export class MedicalWatchRepository {
  constructor(@InjectRepository(MedicalWatchArticle) private readonly repo: Repository<MedicalWatchArticle>) {}

  async upsertArticles(articles: Partial<MedicalWatchArticle>[]): Promise<void> {
    if (articles.length === 0) return;
    await this.repo.upsert(articles, { conflictPaths: ['pmid'], skipUpdateIfNoValuesChanged: true });
  }

  count(): Promise<number> {
    return this.repo.count();
  }

  findAll(specialty?: MedicalWatchSpecialty, limit = 50): Promise<MedicalWatchArticle[]> {
    return this.repo.find({
      where: specialty ? { specialty } : {},
      order: { fetchedAt: 'DESC' },
      take: limit,
    });
  }
}
