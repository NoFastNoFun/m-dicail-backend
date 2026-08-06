import { Injectable } from '@nestjs/common';
import { ANONYMIZATION_RULES } from '../constants/anonymization-patterns.constants';
import { AnonymizationResult, AnonymizationDetection } from '../interfaces/anonymization.interface';

@Injectable()
export class AnonymizationService {
  anonymize(rawText: string): AnonymizationResult {
    if (!rawText.trim()) {
      return { anonymizedText: '', detections: [] };
    }

    let text = rawText;
    const detections: AnonymizationDetection[] = [];

    for (const rule of ANONYMIZATION_RULES) {
      let count = 0;

      text = text.replace(rule.pattern, (match, ...groups) => {
        count++;
        
        if (rule.type === 'NOM_CIVILITE') {
          return `${groups[0]} [NOM]`;
        }
        return `[${rule.type}]`;
      });

      if (count > 0) {
        detections.push({ type: rule.type, count });
      }
    }

    return { anonymizedText: text, detections };
  }
}
