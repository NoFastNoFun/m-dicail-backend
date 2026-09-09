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

    it('places an unrecognized sentence in other', () => {
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

    it('classifies a range-of-motion measurement as objective via regex', () => {
      const result = service.classify('flexion lombaire : 60 degrés');
      expect(result.objective).toContain('flexion lombaire : 60 degrés');
      expect(result.subjective).toBe('');
    });

    it('classifies muscle testing as objective via regex', () => {
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

    it('classifies a follow-up as plan', () => {
      const result = service.classify('je vous revois dans 8 jours pour réévaluation');
      expect(result.plan).toContain('je vous revois');
    });

    it('correctly distributes a third-person practitioner narrative', () => {
      const text =
        'Le patient a mal au dos. ' +
        'Sa posture au quotidien est très mauvaise et il soulève de lourdes charges tous les jours. ' +
        "Il va falloir lui prescrire des exercices d'étirement.";

      const result = service.classify(text);

      expect(result.subjective).toContain('mal au dos');
      expect(result.objective).toContain('posture');
      expect(result.plan).toContain('étirement');
    });

    it('classifies a referral as plan via regex', () => {
      const result = service.classify('orientation vers un médecin du sport pour bilan complémentaire');
      expect(result.plan).toContain('orientation vers');
    });

    it('classifies a work stoppage as plan via regex', () => {
      const result = service.classify('arrêt de travail de 5 jours');
      expect(result.plan).toContain('arrêt de travail');
    });

    it('classifies program setup as plan via regex', () => {
      const result = service.classify("mise en place d'un programme de renforcement progressif");
      expect(result.plan).toContain('programme de renforcement');
    });

    it('classifies an upcoming appointment as plan via regex', () => {
      const result = service.classify('prochain rendez-vous prévu dans deux semaines');
      expect(result.plan).toContain('prochain rendez-vous');
    });

    it('classifies quantified muscle strength as objective via regex', () => {
      const result = service.classify('force musculaire du quadriceps 4/5');
      expect(result.objective).toContain('force musculaire');
    });

    it('classifies joint range of motion as objective via regex', () => {
      const result = service.classify('amplitude articulaire : 90 degrés');
      expect(result.objective).toContain('amplitude articulaire');
    });

    it('classifies a clinical observation as objective via regex', () => {
      const result = service.classify('on constate une raideur à la mobilisation passive');
      expect(result.objective).toContain('on constate');
    });

    it('classifies a joint assessment as objective via regex', () => {
      const result = service.classify('le bilan articulaire retrouve une limitation en flexion');
      expect(result.objective).toContain('bilan articulaire');
    });

    it('classifies a clinical picture as assessment via regex', () => {
      const result = service.classify('le tableau clinique oriente vers une origine mécanique');
      expect(result.assessment).toContain('le tableau clinique');
    });

    it('classifies a diagnostic hypothesis as assessment via regex', () => {
      const result = service.classify('ce tableau est compatible avec une tendinopathie de la coiffe des rotateurs');
      expect(result.assessment).toContain('compatible avec');
    });

    it('classifies a retained diagnosis as assessment via regex', () => {
      const result = service.classify('diagnostic retenu : entorse de cheville stade 2');
      expect(result.assessment).toContain('diagnostic retenu');
    });

    it('classifies a complaint introduced by "se plaint de" as subjective via regex', () => {
      const result = service.classify('le patient se plaint de douleurs lombaires importantes');
      expect(result.subjective).toContain('se plaint de');
    });

    it('classifies a consultation reason as subjective via regex', () => {
      const result = service.classify('motif de consultation : douleur au genou droit depuis une chute');
      expect(result.subjective).toContain('motif de consultation');
    });

    it('classifies a consultation-for-reason phrasing as subjective via regex', () => {
      const result = service.classify("il consulte pour une douleur persistante à l'épaule");
      expect(result.subjective).toContain('consulte pour');
    });

    it('correctly distributes a complete physiotherapy assessment', () => {
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

    it('classe un terme pathologique connu isolé dans subjective via le dictionnaire de racines', () => {
      const result = service.classify('tendinopathie du sus-épineux droit');
      expect(result.subjective).toContain('tendinopathie');
    });

    it('classe un terme pathologique composé (préfixe + suffixe) inconnu dans assessment via le dictionnaire de racines', () => {
      const result = service.classify('suspicion de chondropathie fémoro-patellaire');
      expect(result.assessment).toContain('chondropathie');
    });

    it('classe un terme pathologique composé avec préfixe de direction dans assessment', () => {
      const result = service.classify('le patient présente une périostite tibiale marquée');
      expect(result.assessment).toContain('périostite');
    });

    it('classe un terme pathologique connu (déjà composé) dans subjective même si dérivable du dictionnaire', () => {
      const result = service.classify('périarthrite de hanche importante');
      expect(result.subjective).toContain('périarthrite');
    });
  });
});
