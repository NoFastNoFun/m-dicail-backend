import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalWatchArticle } from './entities/medical-watch-article.entity';
import { MedicalWatchRepository } from './repositories/medical-watch.repository';
import { MedicalWatchService } from './services/medical-watch.service';
import { MedicalWatchController } from './medical-watch.controller';
import { PubmedModule } from '../pubmed/pubmed.module';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalWatchArticle]), PubmedModule],
  providers: [MedicalWatchService, MedicalWatchRepository],
  controllers: [MedicalWatchController],
})
export class MedicalWatchModule {}
