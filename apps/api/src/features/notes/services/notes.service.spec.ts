import { NotesService } from './notes.service';

describe('NotesService', () => {
  let service: NotesService;

  beforeEach(() => {
    service = new NotesService();
  });

  describe('process', () => {
    it('returns processed text for a session', () => {
      const result = service.process({ session_id: 'session-1', raw_text: 'Raw note content', language: 'fr' });

      expect(result).toEqual({ session_id: 'session-1', processed_text: 'Raw note content' });
    });
  });

  describe('summarize', () => {
    it('returns a truncated summary', () => {
      const text = 'This is a long processed clinical note';

      const result = service.summarize({ session_id: 'session-1', processed_text: text, language: 'fr' });

      expect(result.summary).toBe(text.slice(0, 20));
    });
  });
});
