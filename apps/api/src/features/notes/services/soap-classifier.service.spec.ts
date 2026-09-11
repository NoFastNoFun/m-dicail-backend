import { SoapClassifierService } from './soap-classifier.service';

describe('SoapClassifierService', () => {
  let service: SoapClassifierService;

  beforeEach(() => {
    service = new SoapClassifierService();
  });

  describe('classify', () => {
    it('returns 5 empty sections for empty text', () => {
      const result = service.classify('');
      expect(result).toEqual({ subjective: '', objective: '', assessment: '', plan: '', other: '' });
    });

    it('puts an unrecognized sentence in other', () => {
      const result = service.classify("hm d'accord très bien");
      expect(result.other).toContain("hm d'accord très bien");
      expect(result.subjective).toBe('');
      expect(result.objective).toBe('');
      expect(result.assessment).toBe('');
      expect(result.plan).toBe('');
    });

    it('classifies a pain complaint as subjective', () => {
      const result = service.classify("j'ai mal au bas du dos depuis 3 semaines");
      expect(result.subjective).toContain("j'ai mal au bas du dos depuis 3 semaines");
    });

    it('classifies a functional limitation as subjective', () => {
      const result = service.classify("je n'arrive plus à lever le bras au-dessus de l'épaule");
      expect(result.subjective).toContain("je n'arrive plus à lever le bras");
    });

    it('classifies a range-of-motion measure as objective via regex', () => {
      const result = service.classify('flexion lombaire : 60 degrés');
      expect(result.objective).toContain('flexion lombaire : 60 degrés');
      expect(result.subjective).toBe('');
    });

    it('classifies a muscle testing result as objective via regex', () => {
      const result = service.classify('testing du quadriceps coté 4/5');
      expect(result.objective).toContain('testing du quadriceps');
    });

    it('classifies palpation findings as objective', () => {
      const result = service.classify('à la palpation on note une contracture des trapèzes');
      expect(result.objective).toContain('à la palpation');
    });

    it('classifies a diagnosis as assessment via regex', () => {
      const result = service.classify("il s'agit d'une lombalgie commune avec contracture paravertébrale");
      expect(result.assessment).toContain('lombalgie');
    });

    it('classifies an evaluation as assessment', () => {
      const result = service.classify('le bilan montre une limitation de la rotation cervicale gauche');
      expect(result.assessment).toContain('limitation de la rotation cervicale');
    });

    it('classifies a prescription as plan via regex', () => {
      const result = service.classify('je vous prescris 10 séances de kinésithérapie');
      expect(result.plan).toContain('je vous prescris 10 séances de kinésithérapie');
    });

    it('classifies follow-up wording as plan', () => {
      const result = service.classify('je vous revois dans 8 jours pour réévaluation');
      expect(result.plan).toContain('je vous revois');
    });

    it('distributes third-person practitioner narration across sections', () => {
      const text =
        'Le patient a mal au dos. ' +
        'Sa posture au quotidien est très mauvaise et il soulève de lourdes charges tous les jours. ' +
        "Il va falloir lui prescrire des exercices d'étirement.";

      const result = service.classify(text);

      expect(result.subjective).toContain('mal au dos');
      expect(result.objective).toContain('posture');
      expect(result.plan).toContain('étirement');
    });

    it('distributes a full physiotherapy assessment across sections', () => {
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
