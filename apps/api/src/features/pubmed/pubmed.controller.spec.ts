import { Test, TestingModule } from '@nestjs/testing';
import { PubmedController } from './pubmed.controller';
import { PubmedService } from './services/pubmed.service';

describe('PubmedController', () => {
  let controller: PubmedController;
  let pubmedService: jest.Mocked<PubmedService>;

  beforeEach(async () => {
    pubmedService = {
      search: jest.fn(),
      searchMesh: jest.fn(),
    } as unknown as jest.Mocked<PubmedService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PubmedController],
      providers: [{ provide: PubmedService, useValue: pubmedService }],
    }).compile();

    controller = module.get(PubmedController);
  });

  it('search delegates to pubmedService', async () => {
    const articles = [{ pmid: '1', title: 'Article', abstract: '', authors: [], publication_date: '2024', doi: null }];
    pubmedService.search.mockResolvedValue(articles);

    await expect(controller.search({ query: 'physio', max_results: 5 })).resolves.toBe(articles);
    expect(pubmedService.search).toHaveBeenCalledWith('physio', 5);
  });

  it('searchMesh delegates to pubmedService', async () => {
    const descriptors = [{ mesh_ui: 'D017116', term: 'Low Back Pain', synonyms: [], tree_numbers: ['C05.116'] }];
    pubmedService.searchMesh.mockResolvedValue(descriptors);

    await expect(controller.searchMesh({ query: 'lombalgie', max_results: 5 })).resolves.toBe(descriptors);
    expect(pubmedService.searchMesh).toHaveBeenCalledWith('lombalgie', 5);
  });
});
