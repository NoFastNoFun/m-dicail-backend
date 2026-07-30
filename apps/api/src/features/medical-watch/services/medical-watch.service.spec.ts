import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { MedicalWatchService } from './medical-watch.service';
import { PubmedService } from '../../pubmed/services/pubmed.service';
import { MedicalWatchRepository } from '../repositories/medical-watch.repository';
import { MedicalWatchArticle } from '../entities/medical-watch-article.entity';
import { MedicalWatchSpecialty } from '../enums/medical-watch-specialty.enum';

describe('MedicalWatchService', () => {
  let service: MedicalWatchService;
  let pubmedService: jest.Mocked<PubmedService>;
  let repository: jest.Mocked<MedicalWatchRepository>;

  const mockArticle: MedicalWatchArticle = {
    pmid: '12345',
    specialty: MedicalWatchSpecialty.REHABILITATION,
    title: 'Test Article',
    abstract: 'Test abstract',
    authors: ['Author 1'],
    publicationDate: '2024-01-01',
    doi: '10.1234/test',
    searchQuery: 'physiotherapy rehabilitation',
    fetchedAt: new Date('2024-06-01'),
  };

  const mockArticleDto = {
    pmid: '12345',
    specialty: MedicalWatchSpecialty.REHABILITATION,
    title: 'Test Article',
    abstract: 'Test abstract',
    authors: ['Author 1'],
    publication_date: '2024-01-01',
    doi: '10.1234/test',
    search_query: 'physiotherapy rehabilitation',
    fetched_at: new Date('2024-06-01'),
  };

  beforeEach(async () => {
    pubmedService = {
      search: jest.fn(),
    } as unknown as jest.Mocked<PubmedService>;

    repository = {
      findAll: jest.fn(),
      upsertArticles: jest.fn(),
    } as unknown as jest.Mocked<MedicalWatchRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalWatchService,
        { provide: PubmedService, useValue: pubmedService },
        { provide: MedicalWatchRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(MedicalWatchService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getArticles', () => {
    it('should return all articles when no filters are provided', async () => {
      repository.findAll.mockResolvedValue([mockArticle]);

      const result = await service.getArticles();

      expect(repository.findAll).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual([mockArticleDto]);
    });

    it('should return filtered articles by specialty', async () => {
      repository.findAll.mockResolvedValue([mockArticle]);

      const result = await service.getArticles(MedicalWatchSpecialty.REHABILITATION);

      expect(repository.findAll).toHaveBeenCalledWith(MedicalWatchSpecialty.REHABILITATION, undefined);
      expect(result).toEqual([mockArticleDto]);
    });

    it('should return limited number of articles', async () => {
      repository.findAll.mockResolvedValue([mockArticle]);

      const result = await service.getArticles(undefined, 5);

      expect(repository.findAll).toHaveBeenCalledWith(undefined, 5);
      expect(result).toEqual([mockArticleDto]);
    });

    it('should return filtered and limited articles', async () => {
      repository.findAll.mockResolvedValue([mockArticle]);

      const result = await service.getArticles(MedicalWatchSpecialty.MUSCULOSKELETAL, 10);

      expect(repository.findAll).toHaveBeenCalledWith(MedicalWatchSpecialty.MUSCULOSKELETAL, 10);
      expect(result).toEqual([mockArticleDto]);
    });
  });

  describe('runDailyWatch', () => {
    it('should fetch and store articles for all specialties', async () => {
      pubmedService.search.mockResolvedValue([
        {
          pmid: '12345',
          title: 'Test Article',
          abstract: 'Test abstract',
          authors: ['Author 1'],
          publication_date: '2024-01-01',
          doi: '10.1234/test',
        },
      ]);

      await service.runDailyWatch();

      // Should be called for each specialty
      expect(pubmedService.search).toHaveBeenCalledTimes(4);
      expect(repository.upsertArticles).toHaveBeenCalledTimes(4);
    });

    it('should continue processing other specialties if one fails', async () => {
      pubmedService.search
        .mockResolvedValueOnce([
          {
            pmid: '11111',
            title: 'Article 1',
            abstract: 'Abstract 1',
            authors: ['Author 1'],
            publication_date: '2024-01-01',
            doi: null,
          },
        ])
        .mockRejectedValueOnce(new Error('PubMed API error'))
        .mockResolvedValueOnce([
          {
            pmid: '22222',
            title: 'Article 2',
            abstract: 'Abstract 2',
            authors: ['Author 2'],
            publication_date: '2024-01-02',
            doi: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            pmid: '33333',
            title: 'Article 3',
            abstract: 'Abstract 3',
            authors: ['Author 3'],
            publication_date: '2024-01-03',
            doi: null,
          },
        ]);

      await service.runDailyWatch();

      // Should be called for all 4 specialties despite one failure
      expect(pubmedService.search).toHaveBeenCalledTimes(4);
      // Should only upsert for successful fetches (3 out of 4)
      expect(repository.upsertArticles).toHaveBeenCalledTimes(3);
      // Verify error was logged
      expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining('Failed for specialty'));
    });
  });

  describe('runManually', () => {
    it('should fetch and store articles for all specialties', async () => {
      pubmedService.search.mockResolvedValue([
        {
          pmid: '12345',
          title: 'Test Article',
          abstract: 'Test abstract',
          authors: ['Author 1'],
          publication_date: '2024-01-01',
          doi: null,
        },
      ]);

      await service.runManually();

      expect(pubmedService.search).toHaveBeenCalledTimes(4);
      expect(repository.upsertArticles).toHaveBeenCalledTimes(4);
    });

    it('should handle errors gracefully', async () => {
      pubmedService.search.mockRejectedValue(new Error('Network error'));

      await expect(service.runManually()).resolves.not.toThrow();

      expect(Logger.prototype.error).toHaveBeenCalledTimes(4);
    });
  });
});
