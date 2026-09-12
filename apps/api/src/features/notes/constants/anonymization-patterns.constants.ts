import { AnonymizationRule } from '../interfaces/anonymization.interface';

const FRENCH_MONTHS = 'janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre';

/** French PII detectors. Emails/phones/NIR before names so a phone is not treated as a name. */
export const ANONYMIZATION_RULES: AnonymizationRule[] = [
  {
    type: 'EMAIL',
    pattern: /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/g,
  },
  {
    type: 'TELEPHONE',
    pattern: /(?:(?:\+|00)33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g,
  },
  {
    type: 'NIR',
    pattern: /\b[12]\s?\d{2}\s?(0[1-9]|1[0-2])\s?(\d{2}|2[AB])\s?\d{3}\s?\d{3}\s?\d{2}\b/g,
  },
  {
    type: 'DATE',
    pattern: /\b(0?[1-9]|[12]\d|3[01])[/.-](0?[1-9]|1[0-2])[/.-](\d{4}|\d{2})\b/g,
  },
  {
    type: 'DATE',
    pattern: new RegExp(`\\b(0?[1-9]|[12]\\d|3[01])\\s+(?:${FRENCH_MONTHS})\\s+(\\d{4})\\b`, 'gi'),
  },
  {
    type: 'DATE',
    pattern: /\b\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g,
  },
  {
    type: 'ADRESSE',
    pattern:
      /\b\d{1,4}\s?(bis|ter)?\s+(rue|avenue|boulevard|impasse|chemin|allée|allee|place|quai|route|cours|square|villa|passage|faubourg)\s+[A-Za-zÀ-ÿ0-9'’-]{2,40}(?:\s+[A-Za-zÀ-ÿ0-9'’-]{2,20}){0,3}/gi,
  },
  {
    type: 'NOM_CIVILITE',
    pattern: /\b(Monsieur|Madame|Mme|M\.|Mr\.?)\s+([A-ZÀ-Ý][a-zà-ÿ'’-]+(?:\s[A-ZÀ-Ý][a-zà-ÿ'’-]+)?)/g,
    keepGroup0: true,
  },
  {
    type: 'NOM_TITRE',
    pattern: /\b(Dr\.?|Pr\.?|Docteur|Professeur)\s+([A-ZÀ-Ý][a-zà-ÿ'’-]+(?:\s[A-ZÀ-Ý][a-zà-ÿ'’-]+)?)/g,
    keepGroup0: true,
  },
  {
    type: 'NOM_PATIENT',
    pattern: /\b((?:le|la)\s+patient(?:e)?)\s+([A-ZÀ-Ý][a-zà-ÿ'’-]+(?:\s[A-ZÀ-Ý][a-zà-ÿ'’-]+)?)/gi,
    keepGroup0: true,
  },
  {
    type: 'CODE_POSTAL',
    pattern: /\b\d{5}\b/g,
  },
];

/** Replacement token for name-like matches. */
export const NOM_TOKEN = '[NOM]';

/** Maps rule type to replacement token when not using keepGroup0. */
export function replacementToken(type: AnonymizationRule['type']): string {
  switch (type) {
    case 'NOM_CIVILITE':
    case 'NOM_TITRE':
    case 'NOM_PATIENT':
    case 'NOM':
      return NOM_TOKEN;
    default:
      return `[${type}]`;
  }
}
