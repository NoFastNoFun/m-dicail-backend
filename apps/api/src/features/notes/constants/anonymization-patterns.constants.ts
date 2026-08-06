import { AnonymizationRule } from '../interfaces/anonymization.interface';

export const ANONYMIZATION_RULES: AnonymizationRule[] = [
  {
    type: 'EMAIL',
    pattern: /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/g,
  },
  {
    type: 'TELEPHONE',
    pattern: /(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g,
  },
  {
  
    type: 'NIR',
    pattern: /\b[12]\s?\d{2}\s?(0[1-9]|1[0-2])\s?(\d{2}|2[AB])\s?\d{3}\s?\d{3}\s?\d{2}\b/g,
  },
  {
   
    type: 'DATE',
    pattern: /\b(0?[1-9]|[12]\d|3[01])[\/\-.](0?[1-9]|1[0-2])[\/\-.](\d{4}|\d{2})\b/g,
  },
  {

    type: 'ADRESSE',
    pattern: /\b\d{1,4}\s?(bis|ter)?\s+(rue|avenue|boulevard|impasse|chemin|allée|place|quai|route)\s+[A-Za-zÀ-ÿ0-9'’\-\s]{2,40}/gi,
  },
  {

    type: 'NOM_CIVILITE',
    pattern: /\b(Monsieur|Madame|Mme|M\.|Mr\.?)\s+([A-ZÀ-Ý][a-zà-ÿ'’\-]+(?:\s[A-ZÀ-Ý][a-zà-ÿ'’\-]+)?)/g,
  },
  {

    type: 'CODE_POSTAL',
    pattern: /\b\d{5}\b/g,
  },
];
