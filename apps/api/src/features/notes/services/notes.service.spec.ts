import { NotesService } from './notes.service';
import { SoapClassifierService } from './soap-classifier.service';
import { AnonymizationService } from './anonymization.service';

describe('NotesService', () => {
  let service: NotesService;

  beforeEach(() => {
    service = new NotesService(new SoapClassifierService(), new AnonymizationService());
  });

  describe('process', () => {
    it('returns session_id and processed_text equal to raw_text', () => {
      const result = service.process({ session_id: 'abc', raw_text: 'bonjour', language: 'fr' });
      expect(result.session_id).toBe('abc');
      expect(result.processed_text).toBe('bonjour');
    });

    it('returns a soap_note with all 5 sections', () => {
      const result = service.process({ session_id: 'abc', raw_text: 'bonjour', language: 'fr' });
      expect(result.soap_note).toBeDefined();
      expect(result.soap_note).toHaveProperty('subjective');
      expect(result.soap_note).toHaveProperty('objective');
      expect(result.soap_note).toHaveProperty('assessment');
      expect(result.soap_note).toHaveProperty('plan');
      expect(result.soap_note).toHaveProperty('other');
    });

    it('classifies physiotherapy text into soap_note sections', () => {
      const result = service.process({
        session_id: 'abc',
        raw_text: "j'ai mal au genou depuis 2 semaines. je vous prescris 8 séances de kinésithérapie.",
        language: 'fr',
      });
      expect(result.soap_note.subjective).toContain('genou');
      expect(result.soap_note.plan).toContain('séances de kinésithérapie');
    });

    it('anonymizes text before SOAP classification', () => {
      const result = service.process({
        session_id: 'abc',
        raw_text:
          'Madame Dupont, née le 14/03/1985, contactable au 06 12 34 56 78, se plaint de douleurs cervicales depuis 3 semaines. je prescris 10 séances de kinésithérapie.',
        language: 'fr',
      });

      expect(result.processed_text).not.toContain('Dupont');
      expect(result.processed_text).not.toContain('14/03/1985');
      expect(result.processed_text).not.toContain('06 12 34 56 78');

      expect(result.soap_note.subjective).toContain('douleurs cervicales');
      expect(result.soap_note.plan).toContain('séances de kinésithérapie');
    });
  });

  describe('summarize', () => {
    it('returns the first 20 characters', () => {
      const result = service.summarize({
        session_id: 'abc',
        processed_text: 'un texte assez long pour tester le slice',
        language: 'fr',
      });
      expect(result.summary).toBe('un texte assez long ');
      expect(result.summary.length).toBe(20);
    });

    it('returns the full text when shorter than 20 characters', () => {
      const result = service.summarize({ session_id: 'abc', processed_text: 'court', language: 'fr' });
      expect(result.summary).toBe('court');
    });

    it('anonymizes processed_text before truncating', () => {
      const result = service.summarize({
        session_id: 'abc',
        processed_text: 'écrire à jean.dupont@gmail.com pour suite',
        language: 'fr',
      });
      expect(result.summary).not.toContain('jean.dupont@gmail.com');
      expect(result.summary).toContain('[EMAIL]');
    });
  });
});
