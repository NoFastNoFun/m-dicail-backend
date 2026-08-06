import { SoapClassifierService } from './soap-classifier.service';

describe('SoapClassifierService', () => {
  let service: SoapClassifierService;

  beforeEach(() => {
    service = new SoapClassifierService();
  });

  describe('classify', () => {
    it('renvoie 5 sections vides pour un texte vide', () => {
      const result = service.classify('');
      expect(result).toEqual({ subjective: '', objective: '', assessment: '', plan: '', other: '' });
    });

    it('place une phrase non reconnue dans other', () => {
      const result = service.classify("hm d'accord très bien");
      expect(result.other).toContain("hm d'accord très bien");
      expect(result.subjective).toBe('');
      expect(result.objective).toBe('');
      expect(result.assessment).toBe('');
      expect(result.plan).toBe('');
    });

    it('classe une plainte de douleur dans subjective', () => {
      const result = service.classify("j'ai mal au bas du dos depuis 3 semaines");
      expect(result.subjective).toContain("j'ai mal au bas du dos depuis 3 semaines");
    });

    it('classe une gêne fonctionnelle dans subjective', () => {
      const result = service.classify("je n'arrive plus à lever le bras au-dessus de l'épaule");
      expect(result.subjective).toContain("je n'arrive plus à lever le bras");
    });

    it("classe une mesure d'amplitude dans objective via regex", () => {
      const result = service.classify('flexion lombaire : 60 degrés');
      expect(result.objective).toContain('flexion lombaire : 60 degrés');
      expect(result.subjective).toBe('');
    });

    it('classe un testing musculaire dans objective via regex', () => {
      const result = service.classify('testing du quadriceps coté 4/5');
      expect(result.objective).toContain('testing du quadriceps');
    });

    it('classe une palpation dans objective', () => {
      const result = service.classify('à la palpation on note une contracture des trapèzes');
      expect(result.objective).toContain('à la palpation');
    });

    it('classe un diagnostic dans assessment via regex', () => {
      const result = service.classify("il s'agit d'une lombalgie commune avec contracture paravertébrale");
      expect(result.assessment).toContain('lombalgie');
    });

    it('classe une évaluation dans assessment', () => {
      const result = service.classify('le bilan montre une limitation de la rotation cervicale gauche');
      expect(result.assessment).toContain('limitation de la rotation cervicale');
    });

    it('classe une prescription dans plan via regex', () => {
      const result = service.classify('je vous prescris 10 séances de kinésithérapie');
      expect(result.plan).toContain('je vous prescris 10 séances de kinésithérapie');
    });

    it('classe un suivi dans plan', () => {
      const result = service.classify('je vous revois dans 8 jours pour réévaluation');
      expect(result.plan).toContain('je vous revois');
    });

    it('distribue correctement un texte narré par le praticien à la 3ème personne', () => {
      const text =
        'Le patient a mal au dos. ' +
        'Sa posture au quotidien est très mauvaise et il soulève de lourdes charges tous les jours. ' +
        "Il va falloir lui prescrire des exercices d'étirement.";

      const result = service.classify(text);

      expect(result.subjective).toContain('mal au dos');
      expect(result.objective).toContain('posture');
      expect(result.plan).toContain('étirement');
    });

    it('distribue correctement un bilan kiné complet', () => {
      const text =
        'le patient se plaint de douleurs cervicales irradiant dans le bras gauche depuis deux semaines. ' +
        'à la palpation contracture des trapèzes supérieurs bilatérale, rotation cervicale gauche limitée à 30 degrés. ' +
        "il s'agit d'une cervicalgie avec syndrome irritatif radiculaire C6. " +
        'je prescris 10 séances de kinésithérapie avec mobilisations et étirements cervicaux.';

      const result = service.classify(text);

      expect(result.subjective).toContain('douleurs cervicales');
      expect(result.objective).toContain('contracture des trapèzes');
      expect(result.assessment).toContain('cervicalgie');
      expect(result.plan).toContain('séances de kinésithérapie');
    });
  });
});
