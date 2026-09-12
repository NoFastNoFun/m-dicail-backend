import { AnonymizationService } from './anonymization.service';

describe('AnonymizationService', () => {
  let service: AnonymizationService;

  beforeEach(() => {
    service = new AnonymizationService();
  });

  describe('anonymize', () => {
    it('returns empty text for empty input', () => {
      const result = service.anonymize('');
      expect(result).toEqual({ anonymizedText: '', detections: [] });
    });

    it('masks an email address', () => {
      const result = service.anonymize('contactez-moi à jean.dupont@gmail.com');
      expect(result.anonymizedText).toContain('[EMAIL]');
      expect(result.anonymizedText).not.toContain('jean.dupont@gmail.com');
      expect(result.detections).toContainEqual({ type: 'EMAIL', count: 1 });
    });

    it('masks a phone number', () => {
      const result = service.anonymize('vous pouvez me joindre au 06 12 34 56 78');
      expect(result.anonymizedText).toContain('[TELEPHONE]');
      expect(result.anonymizedText).not.toContain('06 12 34 56 78');
    });

    it('masks a compact phone number 0612345678', () => {
      const result = service.anonymize('joindre au 0612345678 demain');
      expect(result.anonymizedText).toContain('[TELEPHONE]');
      expect(result.anonymizedText).not.toContain('0612345678');
    });

    it('masks a phone number in 0033 format', () => {
      const result = service.anonymize('joindre au 0033 6 12 34 56 78 demain');
      expect(result.anonymizedText).toContain('[TELEPHONE]');
      expect(result.anonymizedText).not.toContain('0033 6 12 34 56 78');
    });

    it('masks a name after an honorific', () => {
      const result = service.anonymize('Monsieur Dupont se plaint de douleurs lombaires');
      expect(result.anonymizedText).toBe('Monsieur [NOM] se plaint de douleurs lombaires');
    });

    it('masks a name after Dr', () => {
      const result = service.anonymize('vu par le Dr Martin pour lombalgie');
      expect(result.anonymizedText).toContain('[NOM]');
      expect(result.anonymizedText).not.toContain('Martin');
    });

    it('masks a name after "le patient"', () => {
      const result = service.anonymize('le patient Dupont se plaint de cervicalgies');
      expect(result.anonymizedText).toContain('[NOM]');
      expect(result.anonymizedText).not.toContain('Dupont');
    });

    it('masks a numeric date', () => {
      const result = service.anonymize('né le 14/03/1985, patient suivi depuis janvier');
      expect(result.anonymizedText).toContain('[DATE]');
      expect(result.anonymizedText).not.toContain('14/03/1985');
    });

    it('masks a French written date', () => {
      const result = service.anonymize('né le 14 mars 1985, suivi en cabinet');
      expect(result.anonymizedText).toContain('[DATE]');
      expect(result.anonymizedText).not.toContain('14 mars 1985');
    });

    it('masks an ISO date', () => {
      const result = service.anonymize('naissance 1985-03-14 confirmée');
      expect(result.anonymizedText).toContain('[DATE]');
      expect(result.anonymizedText).not.toContain('1985-03-14');
    });

    it('masks a NIR', () => {
      const result = service.anonymize('NIR 1 85 03 75 123 456 78 à vérifier');
      expect(result.anonymizedText).toContain('[NIR]');
      expect(result.anonymizedText).not.toContain('1 85 03 75 123 456 78');
    });

    it('masks an address', () => {
      const result = service.anonymize('domicilié au 12 rue des Lilas, suivi en cabinet');
      expect(result.anonymizedText).toContain('[ADRESSE]');
    });

    it('leaves clinical text without PII unchanged', () => {
      const text = "j'ai mal au bas du dos depuis 3 semaines";
      const result = service.anonymize(text);
      expect(result.anonymizedText).toBe(text);
      expect(result.detections).toEqual([]);
    });

    it('does not mask a month alone without day or year', () => {
      const text = "J'ai mal depuis décembre";
      const result = service.anonymize(text);
      expect(result.anonymizedText).toBe(text);
      expect(result.detections).toEqual([]);
    });

    it('accumulates multiple detections on mixed text', () => {
      const result = service.anonymize('Madame Martin, née le 02/05/1990, contactable au 07 89 12 34 56, se plaint de cervicalgies.');
      expect(result.anonymizedText).toContain('[NOM]');
      expect(result.anonymizedText).toContain('[DATE]');
      expect(result.anonymizedText).toContain('[TELEPHONE]');
      expect(result.detections.length).toBe(3);
    });

    it('masks known patient identifiers without an honorific', () => {
      const result = service.anonymize('Marie Dupont, email marie.dupont@example.com, née 1990-05-02, vient pour lombalgie', {
        firstName: 'Marie',
        lastName: 'Dupont',
        birthDate: '1990-05-02',
        email: 'marie.dupont@example.com',
      });
      expect(result.anonymizedText).not.toContain('Marie');
      expect(result.anonymizedText).not.toContain('Dupont');
      expect(result.anonymizedText).not.toContain('marie.dupont@example.com');
      expect(result.anonymizedText).not.toContain('1990-05-02');
      expect(result.anonymizedText).toContain('[NOM]');
      expect(result.anonymizedText).toContain('[EMAIL]');
      expect(result.anonymizedText).toContain('[DATE]');
      expect(result.anonymizedText).toContain('lombalgie');
    });
  });
});
