import { Injectable } from '@nestjs/common';
import { ANONYMIZATION_RULES, NOM_TOKEN, replacementToken } from '../constants/anonymization-patterns.constants';
import { AnonymizationDetection, AnonymizationEntityType, AnonymizationResult, KnownPatientIdentifiers } from '../interfaces/anonymization.interface';

const MIN_TOKEN_LENGTH = 3;

@Injectable()
export class AnonymizationService {
  /**
   * Scrubs PII from clinical text. Known patient identifiers are applied first
   * (exact values), then generic regex rules. Name variants collapse to NOM.
   */
  anonymize(rawText: string, identifiers?: KnownPatientIdentifiers | null): AnonymizationResult {
    if (!rawText.trim()) {
      return { anonymizedText: '', detections: [] };
    }

    let text = rawText;
    const detectionCounts = new Map<AnonymizationEntityType, number>();

    const bump = (type: AnonymizationEntityType, n = 1) => {
      detectionCounts.set(type, (detectionCounts.get(type) ?? 0) + n);
    };

    if (identifiers) {
      text = this.applyKnownIdentifiers(text, identifiers, bump);
    }

    for (const rule of ANONYMIZATION_RULES) {
      // Clone so lastIndex on global patterns does not leak across calls.
      const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
      let count = 0;

      text = text.replace(pattern, (match, ...groups) => {
        count++;
        if (rule.keepGroup0) {
          // Keep honorific/title; only replace the captured name.
          return `${groups[0]} ${NOM_TOKEN}`;
        }
        return replacementToken(rule.type);
      });

      if (count > 0) {
        bump(rule.type === 'NOM_CIVILITE' || rule.type === 'NOM_TITRE' || rule.type === 'NOM_PATIENT' ? 'NOM' : rule.type, count);
      }
    }

    const detections: AnonymizationDetection[] = [...detectionCounts.entries()].map(([type, count]) => ({
      type,
      count,
    }));

    return { anonymizedText: text, detections };
  }

  private applyKnownIdentifiers(text: string, identifiers: KnownPatientIdentifiers, bump: (type: AnonymizationEntityType, n?: number) => void): string {
    const replacements: { value: string; token: string; type: AnonymizationEntityType }[] = [];

    const first = identifiers.firstName?.trim();
    const last = identifiers.lastName?.trim();

    if (first && last && first.length >= MIN_TOKEN_LENGTH && last.length >= MIN_TOKEN_LENGTH) {
      replacements.push({ value: `${first} ${last}`, token: NOM_TOKEN, type: 'NOM' });
      replacements.push({ value: `${last} ${first}`, token: NOM_TOKEN, type: 'NOM' });
    }
    if (last && last.length >= MIN_TOKEN_LENGTH) {
      replacements.push({ value: last, token: NOM_TOKEN, type: 'NOM' });
    }
    if (first && first.length >= MIN_TOKEN_LENGTH) {
      replacements.push({ value: first, token: NOM_TOKEN, type: 'NOM' });
    }
    if (identifiers.mrn?.trim() && identifiers.mrn.trim().length >= MIN_TOKEN_LENGTH) {
      replacements.push({ value: identifiers.mrn.trim(), token: '[MRN]', type: 'MRN' });
    }
    if (identifiers.birthDate?.trim()) {
      replacements.push({ value: identifiers.birthDate.trim(), token: '[DATE]', type: 'DATE' });
    }
    if (identifiers.email?.trim()) {
      replacements.push({ value: identifiers.email.trim(), token: '[EMAIL]', type: 'EMAIL' });
    }
    if (identifiers.phone?.trim() && identifiers.phone.trim().length >= MIN_TOKEN_LENGTH) {
      replacements.push({ value: identifiers.phone.trim(), token: '[TELEPHONE]', type: 'TELEPHONE' });
    }
    if (identifiers.address?.trim() && identifiers.address.trim().length >= MIN_TOKEN_LENGTH) {
      replacements.push({ value: identifiers.address.trim(), token: '[ADRESSE]', type: 'ADRESSE' });
    }

    // Longest-first so "Marie Dupont" is replaced before "Marie" alone.
    replacements.sort((a, b) => b.value.length - a.value.length);

    let result = text;
    for (const { value, token, type } of replacements) {
      const pattern = new RegExp(`\\b${escapeRegExp(value)}\\b`, 'gi');
      let count = 0;
      result = result.replace(pattern, () => {
        count++;
        return token;
      });
      if (count > 0) bump(type, count);
    }

    return result;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
