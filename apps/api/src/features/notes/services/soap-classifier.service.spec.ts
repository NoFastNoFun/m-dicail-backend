import { SoapClassifierService } from './soap-classifier.service';
import { SoapSection } from '../interfaces/soap-note.interface';
import { SOAP_KEYWORDS } from '../constants/soap-keywords.constants';

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

    it('classifies a pathology name as assessment', () => {
      const result = service.classify('tendinopathie du sus-épineux droit');
      expect(result.assessment).toContain('tendinopathie');
    });

    it('classifies a rarer pathology name from the physio vocabulary as assessment', () => {
      const result = service.classify('suspicion de chondropathie fémoro-patellaire');
      expect(result.assessment).toContain('chondropathie');
    });

    it('does not let a neutral third-person subject pull a diagnosis into subjective', () => {
      const result = service.classify('le patient présente une périostite tibiale marquée');
      expect(result.assessment).toContain('périostite');
    });

    it('classifies a pathology name in a treatment sentence by its surrounding cues, not by the name alone', () => {
      const result = service.classify('rééducation de la lombalgie avec exercices de renforcement');
      expect(result.plan).toContain('rééducation');
    });

    it('returns other when two sections score equally instead of favouring the first one', () => {
      const result = service.classify('douleur à la flexion');
      expect(result.other).toContain('douleur à la flexion');
    });

    it('does not match a keyword in the middle of an unrelated word', () => {
      const result = service.classify("l'infirmière a utilisé une aiguille");
      expect(result.other).toContain('aiguille');
    });
  });

  describe('physiotherapy vocabulary', () => {
    const cases: [string, SoapSection][] = [
      ['Elle me dit que ça tire dans le mollet quand elle monte les escaliers.', 'subjective'],
      ['Il est maçon et porte des charges lourdes toute la journée.', 'subjective'],
      ['La douleur la réveille la nuit vers trois heures du matin.', 'subjective'],
      ['Il prend des anti-inflammatoires depuis une semaine sans vraiment de soulagement.', 'subjective'],
      ["Elle est très inquiète à l'idée de devoir se faire opérer.", 'subjective'],
      ["Il n'arrive plus à se pencher pour lacer ses chaussures.", 'subjective'],
      ["Ça craque dans l'épaule quand il lève le bras.", 'subjective'],
      ['La gêne apparaît surtout en fin de journée après le travail sur ordinateur.', 'subjective'],
      ['Elle dort mal à cause de la douleur, plusieurs réveils par nuit.', 'subjective'],
      ['Il a fait une chute de vélo le mois dernier.', 'subjective'],
      ['Elle décrit une sensation de fourmillements dans les doigts le matin.', 'subjective'],
      ['Le patient évalue sa douleur à six sur dix.', 'subjective'],
      ["Il aimerait pouvoir reprendre le tennis avant l'été.", 'subjective'],
      ['Elle a été opérée du ménisque il y a trois mois.', 'subjective'],
      ["L'inspection retrouve une tuméfaction au niveau de la malléole externe.", 'objective'],
      ['La flexion du genou droit est limitée à 100 degrés.', 'objective'],
      ['Le testing du moyen fessier est coté à 3 sur 5.', 'objective'],
      ['Test de Lasègue positif à 40 degrés à gauche.', 'objective'],
      ['Les réflexes rotuliens sont vifs et symétriques.', 'objective'],
      ['On observe une amyotrophie du quadriceps par rapport au côté sain.', 'objective'],
      ["Le signe de Trendelenburg est présent à l'appui unipodal droit.", 'objective'],
      ['La distance doigts-sol est de vingt centimètres.', 'objective'],
      ['Point douloureux à la pression du trapèze supérieur, avec contracture palpable.', 'objective'],
      ['Œdème au godet au niveau de la cheville gauche.', 'objective'],
      ["La marche se fait avec une boiterie d'esquive.", 'objective'],
      ["Rotation interne de l'épaule très limitée, sensation de butée dure.", 'objective'],
      ['Le test de Neer est positif, celui de Jobe aussi.', 'objective'],
      ['Hématome et chaleur locale au niveau du mollet.', 'objective'],
      ['Cotation de la force en abduction à 4 sur 5.', 'objective'],
      ['Tout ceci évoque une tendinopathie du sus-épineux.', 'assessment'],
      ["Il s'agit d'un syndrome fémoro-patellaire sans signe de gravité.", 'assessment'],
      ['Pas de drapeau rouge, le pronostic est favorable.', 'assessment'],
      ["Probable lombosciatique d'origine discale L5.", 'assessment'],
      ['Le patient présente une capsulite rétractile en phase de raideur.', 'assessment'],
      ["Cette douleur est en faveur d'une atteinte radiculaire.", 'assessment'],
      ['Rupture partielle du ligament croisé antérieur probable.', 'assessment'],
      ['Épicondylite aiguë chez un sujet actif.', 'assessment'],
      ['Facteurs de risque : sédentarité et surpoids.', 'assessment'],
      ['Déficit de mobilité de la hanche en rapport avec une coxarthrose débutante.', 'assessment'],
      ['Contre-indication à la manipulation cervicale devant ces signes.', 'assessment'],
      ['Hémiparésie droite sur accident vasculaire cérébral ischémique.', 'assessment'],
      ['Ostéosynthèse du tibia il y a six mois.', 'subjective'],
      ["Elle montre une épaule plus haute que l'autre.", 'objective'],
      ['Il présente un aspect luisant de la peau.', 'objective'],
      ["Elle est tombée dans l'escalier la semaine dernière.", 'subjective'],
      ["Mon objectif, c'est de courir de nouveau avec mes enfants.", 'subjective'],
      ["Je m'essouffle en montant un étage depuis ma pneumonie.", 'subjective'],
      ["Je m'inquiète de ne pas retrouver ma mobilité d'avant.", 'subjective'],
      ['Ça craque et ça brûle derrière la rotule quand je marche.', 'subjective'],
      ['Porter des sacs me fait très mal aux lombaires.', 'subjective'],
      ['Je ne dors plus que quatre heures par nuit à cause de la nuque.', 'subjective'],
      ["Gibbosité thoracique droite au test d'Adams chez l'adolescente.", 'objective'],
      ['La peur du mouvement entretient la douleur chronique.', 'assessment'],
      ['Le risque de chute est élevé chez cette patiente.', 'assessment'],
      ['La limitation fonctionnelle empêche la reprise du poste.', 'assessment'],
      ['Fracture de fatigue du tibia à ne pas exclure.', 'assessment'],
      ["Déconditionnement à l'effort avec chronicité des symptômes.", 'assessment'],
      ['Reprise de la course à pied progressive avec alternance de marche.', 'plan'],
      ['Objectif de traitement : gagner 120 degrés de flexion du genou.', 'plan'],
      ["Drainage lymphatique manuel pour diminuer l'œdème.", 'plan'],
      ['Bilan de fin de série à la dixième séance.', 'plan'],
      ['On va commencer par du renforcement des fessiers et du gainage.', 'plan'],
      ["Je lui conseille d'appliquer de la glace vingt minutes après l'effort.", 'plan'],
      ['Reprise progressive de la course à pied dans quatre semaines.', 'plan'],
      ["Un avis chirurgical est à envisager si pas d'amélioration.", 'plan'],
      ['Voir avec le médecin traitant pour une IRM.', 'plan'],
      ['Séance de mobilisations et de techniques de thérapie manuelle.', 'plan'],
      ['Il devra éviter de porter des charges de plus de cinq kilos.', 'plan'],
      ["Programme d'auto-exercices à faire à la maison deux fois par jour.", 'plan'],
      ['Prévoir une réévaluation à la dixième séance.', 'plan'],
      ['Mise en décharge avec deux cannes pendant trois semaines.', 'plan'],
      ["Nous allons travailler la proprioception et l'équilibre unipodal.", 'plan'],
      ['Pose de strapping et conseils sur le chaussage.', 'plan'],
      ['Ultrasons et massage transverse profond sur le tendon.', 'plan'],
      ["Objectif de traitement : retrouver l'élévation complète du bras.", 'plan'],
      ["Il faut qu'elle continue les étirements tous les soirs.", 'plan'],
      ["Bonjour, installez-vous sur la table s'il vous plaît.", 'other'],
      ["Ok, on s'arrête là pour aujourd'hui.", 'other'],
      ['Vous avez trouvé facilement le cabinet ?', 'other'],
    ];

    it.each(cases)('classifies "%s" as %s', (sentence, expected) => {
      expect(service.classify(sentence)[expected]).toBe(sentence);
    });
  });

  describe('keyword vocabulary hygiene', () => {
    const entries = (Object.entries(SOAP_KEYWORDS) as [SoapSection, string[]][]).flatMap(([section, words]) => words.map((word) => ({ section, word })));

    it('lists every keyword only once, across all sections', () => {
      const seen = new Map<string, SoapSection>();
      const duplicates: string[] = [];
      for (const { section, word } of entries) {
        const key = word.toLowerCase();
        const previous = seen.get(key);
        if (previous) duplicates.push(`${word} (${previous} and ${section})`);
        seen.set(key, section);
      }
      expect(duplicates).toEqual([]);
    });

    it('classifies every keyword, used alone, in its own section', () => {
      const misplaced = entries
        .filter(({ section, word }) => service.classify(word)[section] !== word)
        .map(({ section, word }) => `${word} (expected ${section})`);
      expect(misplaced).toEqual([]);
    });
  });
});
