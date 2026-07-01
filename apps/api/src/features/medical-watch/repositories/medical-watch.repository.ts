import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalWatchArticle } from '../entities/medical-watch-article.entity';

@Injectable()
export class MedicalWatchRepository {
  constructor(@InjectRepository(MedicalWatchArticle) private readonly repo: Repository<MedicalWatchArticle>) {}

  async upsertArticles(articles: Partial<MedicalWatchArticle>[]): Promise<void> {
    await this.repo.upsert(articles, { conflictPaths: ['pmid'], skipUpdateIfNoValuesChanged: true });
  }

  findAll(limit = 50): Promise<MedicalWatchArticle[]> {
    return this.repo.find({ order: { fetchedAt: 'DESC' }, take: limit });
  }
}
