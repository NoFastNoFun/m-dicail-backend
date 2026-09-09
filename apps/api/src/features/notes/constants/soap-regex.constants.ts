import { SoapSection } from '../interfaces/soap-note.interface';
import {
  KNOWN_PATHOLOGY_TERMS,
  MedicalRoot,
  PREFIXES_ANATOMIQUES,
  PREFIXES_DIRECTION,
  PREFIXES_REGIONS,
  SUFFIXES_PATHOLOGIQUES,
} from './medical-root-dictionary.constants';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function variantsOf(roots: MedicalRoot[]): string[] {
  return roots.flatMap((root) => root.variants).map(escapeRegex);
}

// Les racines du dictionnaire sont stockées sans accent (peri, epi,
// epicondyl, odese...) alors que le mot français réel peut en porter un
// (périostite, épicondylite, spondylodèse). On tolère les variantes
// accentuées du "e" plutôt que d'exiger l'orthographe exacte.
function accentTolerant(variant: string): string {
  return variant.replace(/e/g, '[eéèê]');
}

// Un mot déjà nommé (lombalgie, tendinite, arthrose...) est le plus souvent
// employé par le patient/praticien pour désigner son motif de consultation.
const KNOWN_PATHOLOGY_TERM_PATTERN = new RegExp(
  `\\b(?:${KNOWN_PATHOLOGY_TERMS.map(escapeRegex).join('|')})s?\\b`,
  'i',
);

// Terme pathologique construit par composition (préfixe anatomique/région,
// éventuellement précédé d'un préfixe de direction, + suffixe pathologique)
// qui n'est pas déjà un terme connu : vocabulaire technique du diagnostic.
const anatomicalOrRegionVariants = [...variantsOf(PREFIXES_ANATOMIQUES), ...variantsOf(PREFIXES_REGIONS)].map(
  accentTolerant,
);
const directionVariants = variantsOf(PREFIXES_DIRECTION).map(accentTolerant);
const suffixVariants = variantsOf(SUFFIXES_PATHOLOGIQUES).map(accentTolerant);

const PATHOLOGY_SUFFIX_PATTERN = new RegExp(
  `\\b(?:${directionVariants.join('|')})?(?:${anatomicalOrRegionVariants.join('|')})(?:${suffixVariants.join('|')})s?\\b`,
  'i',
);

export const SOAP_REGEX_RULES: { pattern: RegExp; section: SoapSection }[] = [
  { pattern: /je\s+(vous\s+)?(prescris|prescrit|préconise|recommande)/i, section: 'plan' },
  { pattern: /\d+\s*séances/i, section: 'plan' },
  { pattern: /je\s+vous\s+revois/i, section: 'plan' },
  { pattern: /il\s+va\s+falloir\s+lui/i, section: 'plan' },
  { pattern: /lui\s+(prescrire|recommander|conseiller|proposer)/i, section: 'plan' },
  { pattern: /il\s+(faut|faudra|doit|devra)\s+(faire|réaliser|effectuer)/i, section: 'plan' },
  { pattern: /mise\s+en\s+place\s+d['']un\s+(programme|protocole)/i, section: 'plan' },
  { pattern: /orientation\s+vers/i, section: 'plan' },
  { pattern: /(prochain|prochaine)\s+(rendez-vous|séance|consultation)/i, section: 'plan' },
  { pattern: /arrêt\s+de\s+travail/i, section: 'plan' },
  { pattern: /à\s+revoir\s+dans/i, section: 'plan' },
  { pattern: /(flexion|extension|rotation|abduction|adduction|inclinaison)\s*[:-]?\s*\d+/i, section: 'objective' },
  { pattern: /testing\s+.{0,30}\d\s*(sur|\/)\s*5/i, section: 'objective' },
  { pattern: /force\s+musculaire\s*[:-]?\s*\d\s*(sur|\/)\s*5/i, section: 'objective' },
  { pattern: /amplitude\s+(articulaire\s+)?[:-]?\s*\d+\s*degrés?/i, section: 'objective' },
  { pattern: /à\s+la\s+palpation/i, section: 'objective' },
  { pattern: /(on|nous)\s+(note|observe|constate|relève|retrouve)/i, section: 'objective' },
  { pattern: /bilan\s+(articulaire|musculaire)/i, section: 'objective' },
  { pattern: /il\s+s['']agit/i, section: 'assessment' },
  { pattern: /le\s+tableau\s+clinique/i, section: 'assessment' },
  { pattern: /(compatible|en\s+faveur\s+d['']un|évoque\s+un\s+tableau\s+de)/i, section: 'assessment' },
  { pattern: /diagnostic\s+(retenu|évoqué|posé)/i, section: 'assessment' },
  { pattern: /le\s+bilan\s+(montre|met\s+en\s+évidence|révèle)/i, section: 'assessment' },
  { pattern: /depuis\s+\d+/i, section: 'subjective' },
  { pattern: /depuis\s+(quelques|plusieurs)/i, section: 'subjective' },
  { pattern: /(se\s+plaint|se\s+plaignant)\s+de/i, section: 'subjective' },
  { pattern: /(rapporte|décrit|signale|évoque)\s+(des|une|un)\s+(douleur|gêne|difficulté)/i, section: 'subjective' },
  { pattern: /motif\s+de\s+consultation/i, section: 'subjective' },
  { pattern: /consulte\s+pour/i, section: 'subjective' },
  { pattern: KNOWN_PATHOLOGY_TERM_PATTERN, section: 'subjective' },
  { pattern: PATHOLOGY_SUFFIX_PATTERN, section: 'assessment' },
];
