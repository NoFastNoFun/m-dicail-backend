import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './services/notes.service';

describe('NotesController', () => {
  let controller: NotesController;
  let notesService: jest.Mocked<NotesService>;

  beforeEach(async () => {
    notesService = { process: jest.fn() } as unknown as jest.Mocked<NotesService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [{ provide: NotesService, useValue: notesService }],
    }).compile();

    controller = module.get(NotesController);
  });

  it('process delegates to notesService', async () => {
    const dto = { session_id: 'session-1', raw_text: 'text', language: 'fr' };
    const response = {
      session_id: 'session-1',
      processed_text: 'text',
      soap_note: { subjective: 's', objective: 'o', assessment: 'a', plan: 'p', other: '' },
    };
    notesService.process.mockResolvedValue(response);

    await expect(controller.process(dto)).resolves.toBe(response);
    expect(notesService.process).toHaveBeenCalledWith(dto);
  });
});
