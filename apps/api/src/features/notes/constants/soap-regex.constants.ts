import { SoapSection } from '../interfaces/soap-note.interface';

/** High-precision French clinical patterns; first match wins (order matters). */
export const SOAP_REGEX_RULES: { pattern: RegExp; section: SoapSection }[] = [
  { pattern: /je\s+(vous\s+)?(prescris|prescrit|préconise|recommande)/i, section: 'plan' },
  { pattern: /\d+\s*séances/i, section: 'plan' },
  { pattern: /je\s+vous\s+revois/i, section: 'plan' },
  { pattern: /il\s+va\s+falloir\s+lui/i, section: 'plan' },
  { pattern: /lui\s+(prescrire|recommander|conseiller|proposer)/i, section: 'plan' },
  { pattern: /il\s+(faut|faudra|doit|devra)\s+(faire|réaliser|effectuer)/i, section: 'plan' },
  { pattern: /(flexion|extension|rotation|abduction|adduction|inclinaison)\s*[:-]?\s*\d+/i, section: 'objective' },
  { pattern: /testing\s+.{0,30}\d\s*(sur|\/)\s*5/i, section: 'objective' },
  { pattern: /il\s+s['']agit/i, section: 'assessment' },
  { pattern: /depuis\s+\d+/i, section: 'subjective' },
  { pattern: /depuis\s+(quelques|plusieurs)/i, section: 'subjective' },
];
