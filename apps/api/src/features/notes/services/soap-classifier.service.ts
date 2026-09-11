import { Injectable } from '@nestjs/common';
import { SoapNote, SoapSection } from '../interfaces/soap-note.interface';
import { SOAP_KEYWORDS } from '../constants/soap-keywords.constants';
import { SOAP_REGEX_RULES } from '../constants/soap-regex.constants';
import { matchMedicalRootDictionary } from '../utils/medical-root-matcher';

@Injectable()
export class SoapClassifierService {
  /** Split on sentence boundaries, then bucket each sentence into a SOAP section. */
  classify(rawText: string): SoapNote {
    if (!rawText.trim()) {
      return { subjective: '', objective: '', assessment: '', plan: '', other: '' };
    }

    const buckets: Record<SoapSection, string[]> = {
      subjective: [],
      objective: [],
      assessment: [],
      plan: [],
      other: [],
    };

    const sentences = rawText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const sentence of sentences) {
      buckets[this.classifySentence(sentence)].push(sentence);
    }

    return {
      subjective: buckets.subjective.join(' '),
      objective: buckets.objective.join(' '),
      assessment: buckets.assessment.join(' '),
      plan: buckets.plan.join(' '),
      other: buckets.other.join(' '),
    };
  }

  private classifySentence(sentence: string): SoapSection {
    const lower = sentence.toLowerCase();

    // 1) Phrase regex rules (plan / objective / assessment / subjective cues)
    for (const { pattern, section } of SOAP_REGEX_RULES) {
      if (pattern.test(lower)) return section;
    }

    // 2) Medical-root dictionary (known Set lookup, then composed token scan)
    const dictionarySection = matchMedicalRootDictionary(lower);
    if (dictionarySection) return dictionarySection;

    // 3) Keyword scoring fallback
    const scores: Record<SoapSection, number> = {
      subjective: 0,
      objective: 0,
      assessment: 0,
      plan: 0,
      other: 0,
    };

    for (const section of ['subjective', 'objective', 'assessment', 'plan'] as SoapSection[]) {
      for (const keyword of SOAP_KEYWORDS[section]) {
        if (lower.includes(keyword.toLowerCase())) scores[section]++;
      }
    }

    const best = (Object.entries(scores) as [SoapSection, number][]).filter(([s]) => s !== 'other').reduce((max, cur) => (cur[1] > max[1] ? cur : max));

    // Tie / zero hits → other (do not invent a section).
    return best[1] > 0 ? best[0] : 'other';
  }
}
