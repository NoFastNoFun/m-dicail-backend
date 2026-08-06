import { AnonymizationService } from './anonymization.service';

describe('AnonymizationService', () => {
  let service: AnonymizationService;

  beforeEach(() => {
    service = new AnonymizationService();
  });

  describe('anonymize', () => {
    it('renvoie un texte vide pour une entrée vide', () => {
      const result = service.anonymize('');
      expect(result).toEqual({ anonymizedText: '', detections: [] });
    });

    it('masque un email', () => {
      const result = service.anonymize('contactez-moi à jean.dupont@gmail.com');
      expect(result.anonymizedText).toContain('[EMAIL]');
      expect(result.anonymizedText).not.toContain('jean.dupont@gmail.com');
      expect(result.detections).toContainEqual({ type: 'EMAIL', count: 1 });
    });

    it('masque un numéro de téléphone', () => {
      const result = service.anonymize('vous pouvez me joindre au 06 12 34 56 78');
      expect(result.anonymizedText).toContain('[TELEPHONE]');
      expect(result.anonymizedText).not.toContain('06 12 34 56 78');
    });

    it('masque un nom précédé d’une civilité', () => {
      const result = service.anonymize('Monsieur Dupont se plaint de douleurs lombaires');
      expect(result.anonymizedText).toBe('Monsieur [NOM] se plaint de douleurs lombaires');
    });

    it('masque une date', () => {
      const result = service.anonymize('né le 14/03/1985, patient suivi depuis janvier');
      expect(result.anonymizedText).toContain('[DATE]');
      expect(result.anonymizedText).not.toContain('14/03/1985');
    });

    it('masque une adresse', () => {
      const result = service.anonymize('domicilié au 12 rue des Lilas, suivi en cabinet');
      expect(result.anonymizedText).toContain('[ADRESSE]');
    });

    it('ne modifie pas un texte clinique sans PII', () => {
      const text = "j'ai mal au bas du dos depuis 3 semaines";
      const result = service.anonymize(text);
      expect(result.anonymizedText).toBe(text);
      expect(result.detections).toEqual([]);
    });

    it('cumule plusieurs détections sur un texte mixte', () => {
      const result = service.anonymize(
        'Madame Martin, née le 02/05/1990, contactable au 07 89 12 34 56, se plaint de cervicalgies.',
      );
      expect(result.anonymizedText).toContain('[NOM]');
      expect(result.anonymizedText).toContain('[DATE]');
      expect(result.anonymizedText).toContain('[TELEPHONE]');
      expect(result.detections.length).toBe(3);
    });
  });
});
