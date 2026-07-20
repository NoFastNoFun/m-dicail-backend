import { NotesService } from './notes.service';
import { SoapClassifierService } from './soap-classifier.service';

describe('NotesService', () => {
  let service: NotesService;

  beforeEach(() => {
    service = new NotesService(new SoapClassifierService());
  });

  describe('process', () => {
    it('renvoie session_id et processed_text identique au raw_text', () => {
      const result = service.process({ session_id: 'abc', raw_text: 'bonjour', language: 'fr' });
      expect(result.session_id).toBe('abc');
      expect(result.processed_text).toBe('bonjour');
    });

    it('renvoie un soap_note avec les 5 sections', () => {
      const result = service.process({ session_id: 'abc', raw_text: 'bonjour', language: 'fr' });
      expect(result.soap_note).toBeDefined();
      expect(result.soap_note).toHaveProperty('subjective');
      expect(result.soap_note).toHaveProperty('objective');
      expect(result.soap_note).toHaveProperty('assessment');
      expect(result.soap_note).toHaveProperty('plan');
      expect(result.soap_note).toHaveProperty('other');
    });

    it('classe correctement un texte kiné dans soap_note', () => {
      const result = service.process({
        session_id: 'abc',
        raw_text: "j'ai mal au genou depuis 2 semaines. je vous prescris 8 séances de kinésithérapie.",
        language: 'fr',
      });
      expect(result.soap_note.subjective).toContain('genou');
      expect(result.soap_note.plan).toContain('séances de kinésithérapie');
    });
  });

  describe('summarize', () => {
    it('renvoie les 20 premiers caractères', () => {
      const result = service.summarize({ session_id: 'abc', processed_text: 'un texte assez long pour tester le slice', language: 'fr' });
      expect(result.summary).toBe('un texte assez long ');
      expect(result.summary.length).toBe(20);
    });

    it('renvoie le texte complet si moins de 20 caractères', () => {
      const result = service.summarize({ session_id: 'abc', processed_text: 'court', language: 'fr' });
      expect(result.summary).toBe('court');
    });
  });
});
