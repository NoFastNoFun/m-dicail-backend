import { MEDICAL_ROOT_DICTIONARY_SEED, MedicalRoot, MedicalRootDictionarySeed } from '../constants/medical-root-dictionary.constants';
import { SoapSection } from '../interfaces/soap-note.interface';

/** Strip diacritics and lowercase for accent-tolerant matching. */
function normalizeMedicalText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function collectVariants(roots: MedicalRoot[]): string[] {
  return roots.flatMap((root) => root.variants.map(normalizeMedicalText));
}

function stripOptionalPlural(token: string): string {
  if (token.length > 3 && token.endsWith('s')) {
    return token.slice(0, -1);
  }
  return token;
}

/**
 * Precomputed indexes from a dictionary seed.
 * Rebuilding is cheap for the offline seed and stays O(list size) if a PubMed
 * loader swaps in a much larger payload later.
 */
export interface MedicalRootMatcherIndex {
  /** O(1) lookup of known terms, keyed by normalized phrase. */
  knownTerms: Set<string>;
  /** Length-bucketed known terms (word count → set) for multi-word scans. */
  knownTermsByWordCount: Map<number, Set<string>>;
  maxKnownTermWords: number;
  anatomicalOrRegionPrefixes: Set<string>;
  directionPrefixes: string[];
  pathologySuffixes: string[];
}

function buildMedicalRootMatcherIndex(seed: MedicalRootDictionarySeed = MEDICAL_ROOT_DICTIONARY_SEED): MedicalRootMatcherIndex {
  const knownTerms = new Set<string>();
  const knownTermsByWordCount = new Map<number, Set<string>>();
  let maxKnownTermWords = 1;

  for (const term of seed.knownPathologyTerms) {
    const normalized = normalizeMedicalText(term.trim());
    if (!normalized) continue;
    knownTerms.add(normalized);
    const wordCount = normalized.split(/\s+/).length;
    maxKnownTermWords = Math.max(maxKnownTermWords, wordCount);
    let bucket = knownTermsByWordCount.get(wordCount);
    if (!bucket) {
      bucket = new Set();
      knownTermsByWordCount.set(wordCount, bucket);
    }
    bucket.add(normalized);
  }

  const anatomicalOrRegionPrefixes = new Set([...collectVariants(seed.prefixesAnatomiques), ...collectVariants(seed.prefixesRegions)]);

  // Longest-first so "odese" wins over shorter accidental prefixes/suffixes.
  const directionPrefixes = [...new Set(collectVariants(seed.prefixesDirection))].sort((a, b) => b.length - a.length);
  const pathologySuffixes = [...new Set(collectVariants(seed.suffixesPathologiques))].sort((a, b) => b.length - a.length);

  return {
    knownTerms,
    knownTermsByWordCount,
    maxKnownTermWords,
    anatomicalOrRegionPrefixes,
    directionPrefixes,
    pathologySuffixes,
  };
}

const DEFAULT_INDEX = buildMedicalRootMatcherIndex();

/** Letters + internal hyphens (keeps terms like "sacro-iliite" intact). */
function tokenize(normalizedSentence: string): string[] {
  return normalizedSentence.match(/[a-z0-9-]+/g) ?? [];
}

/**
 * True when `term` (or its accent/plural variant) is in the known-term Set.
 * Exported for unit tests that assert Set lookup rather than full classify().
 */
export function isKnownPathologyTerm(term: string, index: MedicalRootMatcherIndex = DEFAULT_INDEX): boolean {
  const normalized = normalizeMedicalText(term.trim());
  if (!normalized) return false;
  if (index.knownTerms.has(normalized)) return true;
  return index.knownTerms.has(stripOptionalPlural(normalized));
}

function hasKnownPathologyTerm(tokens: string[], index: MedicalRootMatcherIndex): boolean {
  const maxN = Math.min(index.maxKnownTermWords, tokens.length);
  for (let n = maxN; n >= 1; n--) {
    const bucket = index.knownTermsByWordCount.get(n);
    if (!bucket || bucket.size === 0) continue;
    for (let i = 0; i <= tokens.length - n; i++) {
      const phrase = tokens.slice(i, i + n).join(' ');
      if (bucket.has(phrase) || bucket.has(stripOptionalPlural(phrase))) {
        return true;
      }
    }
  }
  return false;
}

function stemMatchesAnatomicalOrRegion(stem: string, index: MedicalRootMatcherIndex): boolean {
  if (index.anatomicalOrRegionPrefixes.has(stem)) return true;
  for (const direction of index.directionPrefixes) {
    if (!stem.startsWith(direction)) continue;
    const rest = stem.slice(direction.length);
    if (rest.length > 0 && index.anatomicalOrRegionPrefixes.has(rest)) {
      return true;
    }
  }
  return false;
}

function isComposedPathologyToken(token: string, index: MedicalRootMatcherIndex): boolean {
  const base = stripOptionalPlural(token);
  for (const suffix of index.pathologySuffixes) {
    if (!base.endsWith(suffix) || base.length <= suffix.length) continue;
    const stem = base.slice(0, -suffix.length);
    if (stemMatchesAnatomicalOrRegion(stem, index)) return true;
  }
  return false;
}

function hasComposedPathology(tokens: string[], index: MedicalRootMatcherIndex): boolean {
  return tokens.some((token) => isComposedPathologyToken(token, index));
}

/**
 * Dictionary pass used after phrase regexes and before keyword scoring.
 * Known named terms → subjective; composed Greco-Latin pathology → assessment.
 */
export function matchMedicalRootDictionary(
  sentence: string,
  index: MedicalRootMatcherIndex = DEFAULT_INDEX,
): Extract<SoapSection, 'subjective' | 'assessment'> | null {
  const tokens = tokenize(normalizeMedicalText(sentence));
  if (tokens.length === 0) return null;
  if (hasKnownPathologyTerm(tokens, index)) return 'subjective';
  if (hasComposedPathology(tokens, index)) return 'assessment';
  return null;
}
