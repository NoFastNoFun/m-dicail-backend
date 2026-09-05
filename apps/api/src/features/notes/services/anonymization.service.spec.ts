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

    it('masque un téléphone compact 0612345678', () => {
      const result = service.anonymize('joindre au 0612345678 demain');
      expect(result.anonymizedText).toContain('[TELEPHONE]');
      expect(result.anonymizedText).not.toContain('0612345678');
    });

    it('masque un téléphone au format 0033', () => {
      const result = service.anonymize('joindre au 0033 6 12 34 56 78 demain');
      expect(result.anonymizedText).toContain('[TELEPHONE]');
      expect(result.anonymizedText).not.toContain('0033 6 12 34 56 78');
    });

    it('masque un nom précédé d’une civilité', () => {
      const result = service.anonymize('Monsieur Dupont se plaint de douleurs lombaires');
      expect(result.anonymizedText).toBe('Monsieur [NOM] se plaint de douleurs lombaires');
    });

    it('masque un nom précédé de Dr', () => {
      const result = service.anonymize('vu par le Dr Martin pour lombalgie');
      expect(result.anonymizedText).toContain('[NOM]');
      expect(result.anonymizedText).not.toContain('Martin');
    });

    it('masque un nom après le patient', () => {
      const result = service.anonymize('le patient Dupont se plaint de cervicalgies');
      expect(result.anonymizedText).toContain('[NOM]');
      expect(result.anonymizedText).not.toContain('Dupont');
    });

    it('masque une date numérique', () => {
      const result = service.anonymize('né le 14/03/1985, patient suivi depuis janvier');
      expect(result.anonymizedText).toContain('[DATE]');
      expect(result.anonymizedText).not.toContain('14/03/1985');
    });

    it('masque une date en français', () => {
      const result = service.anonymize('né le 14 mars 1985, suivi en cabinet');
      expect(result.anonymizedText).toContain('[DATE]');
      expect(result.anonymizedText).not.toContain('14 mars 1985');
    });

    it('masque une date ISO', () => {
      const result = service.anonymize('naissance 1985-03-14 confirmée');
      expect(result.anonymizedText).toContain('[DATE]');
      expect(result.anonymizedText).not.toContain('1985-03-14');
    });

    it('masque un NIR', () => {
      const result = service.anonymize('NIR 1 85 03 75 123 456 78 à vérifier');
      expect(result.anonymizedText).toContain('[NIR]');
      expect(result.anonymizedText).not.toContain('1 85 03 75 123 456 78');
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

    it('ne masque pas un mois seul sans jour ni année', () => {
      const text = "J'ai mal depuis décembre";
      const result = service.anonymize(text);
      expect(result.anonymizedText).toBe(text);
      expect(result.detections).toEqual([]);
    });

    it('cumule plusieurs détections sur un texte mixte', () => {
      const result = service.anonymize('Madame Martin, née le 02/05/1990, contactable au 07 89 12 34 56, se plaint de cervicalgies.');
      expect(result.anonymizedText).toContain('[NOM]');
      expect(result.anonymizedText).toContain('[DATE]');
      expect(result.anonymizedText).toContain('[TELEPHONE]');
      expect(result.detections.length).toBe(3);
    });

    it('masque les identifiants patient connus sans civilité', () => {
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
