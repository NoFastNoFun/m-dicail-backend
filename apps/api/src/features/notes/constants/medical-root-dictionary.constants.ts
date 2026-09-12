export interface MedicalRoot {
  id: string;
  variants: string[];
  meaning: string;
}

/**
 * JSON-friendly seed shape for the medical-root dictionary.
 * A future PubMed (or other) loader can merge/replace this payload
 * without changing matcher code — keep `version`/`source` in sync.
 */
export interface MedicalRootDictionarySeed {
  version: number;
  /** Provenance of this payload, e.g. offline-seed | pubmed */
  source: 'offline-seed' | string;
  prefixesAnatomiques: MedicalRoot[];
  prefixesRegions: MedicalRoot[];
  prefixesDirection: MedicalRoot[];
  suffixesPathologiques: MedicalRoot[];
  knownPathologyTerms: string[];
}

// Port of the front-end Greco-Latin root dictionary
// (lib/core/medical_terms/medical_root_dictionary.dart + assets/medical_terms/greco_latin_roots.json)
export const MEDICAL_ROOT_DICTIONARY_SEED: MedicalRootDictionarySeed = {
  version: 1,
  source: 'offline-seed',
  prefixesAnatomiques: [
    { id: 'arthro', variants: ['arthro', 'arthr'], meaning: 'articulation' },
    { id: 'myo', variants: ['myo', 'my'], meaning: 'muscle' },
    { id: 'tendin', variants: ['tendino', 'tendin', 'tendo'], meaning: 'tendon' },
    { id: 'capsul', variants: ['capsulo', 'capsul'], meaning: 'capsule articulaire' },
    { id: 'ligament', variants: ['ligamento', 'ligament'], meaning: 'ligament' },
    { id: 'neuro', variants: ['neuro', 'neur'], meaning: 'nerf' },
    { id: 'radicul', variants: ['radiculo', 'radicul'], meaning: 'racine nerveuse' },
    { id: 'osteo', variants: ['osteo', 'ost'], meaning: 'os' },
    { id: 'chondro', variants: ['chondro', 'chondr'], meaning: 'cartilage' },
    { id: 'spondyl', variants: ['spondylo', 'spondyl'], meaning: 'vertèbre' },
    { id: 'disco', variants: ['disco', 'disc'], meaning: 'disque intervertébral' },
    { id: 'burs', variants: ['burso', 'burs'], meaning: 'bourse séreuse' },
    { id: 'fasci', variants: ['fascio', 'fasci'], meaning: 'fascia' },
    { id: 'epicondyl', variants: ['epicondylo', 'epicondyl'], meaning: 'épicondyle' },
    { id: 'menisc', variants: ['menisco', 'menisc'], meaning: 'ménisque' },
    { id: 'sciat', variants: ['sciat'], meaning: 'nerf sciatique' },
  ],
  prefixesRegions: [
    { id: 'cervic', variants: ['cervico', 'cervic'], meaning: 'cou' },
    { id: 'lombo', variants: ['lombo', 'lomb'], meaning: 'région lombaire' },
    { id: 'dorso', variants: ['dorso', 'dors'], meaning: 'dos / thoracique' },
    { id: 'scapulo', variants: ['scapulo', 'scapul'], meaning: 'omoplate' },
    { id: 'brachi', variants: ['brachio', 'brachi'], meaning: 'bras' },
    { id: 'crural', variants: ['crural', 'crur'], meaning: 'cuisse' },
    { id: 'coxo', variants: ['coxo', 'cox'], meaning: 'hanche' },
    { id: 'gon', variants: ['gono', 'gon'], meaning: 'genou' },
    { id: 'talo', variants: ['talo', 'tal'], meaning: 'talon' },
    { id: 'carpo', variants: ['carpo', 'carp'], meaning: 'poignet' },
    { id: 'claviculo', variants: ['claviculo', 'clavicul'], meaning: 'clavicule' },
    { id: 'sacro', variants: ['sacro', 'sacr'], meaning: 'sacrum' },
  ],
  prefixesDirection: [
    { id: 'epi', variants: ['epi'], meaning: 'sur / au-dessus' },
    { id: 'para', variants: ['para'], meaning: 'à côté de' },
    { id: 'supra', variants: ['supra'], meaning: 'au-dessus de' },
    { id: 'infra', variants: ['infra', 'sub'], meaning: 'en dessous de' },
    { id: 'intra', variants: ['intra'], meaning: "à l'intérieur de" },
    { id: 'inter', variants: ['inter'], meaning: 'entre' },
    { id: 'peri', variants: ['peri'], meaning: 'autour de' },
    { id: 'poly', variants: ['poly'], meaning: 'plusieurs' },
    { id: 'mono', variants: ['mono', 'uni'], meaning: 'un seul' },
    { id: 'hyper', variants: ['hyper'], meaning: 'excès' },
    { id: 'hypo', variants: ['hypo'], meaning: 'défaut' },
    { id: 'dys', variants: ['dys'], meaning: 'anomalie / difficulté' },
  ],
  suffixesPathologiques: [
    { id: 'algie', variants: ['algie'], meaning: 'douleur' },
    { id: 'ite', variants: ['ite'], meaning: 'inflammation' },
    { id: 'ose', variants: ['ose'], meaning: 'dégénérescence chronique' },
    { id: 'pathie', variants: ['pathie'], meaning: 'atteinte / maladie' },
    { id: 'plastie', variants: ['plastie'], meaning: 'reconstruction chirurgicale' },
    { id: 'ectomie', variants: ['ectomie'], meaning: 'ablation chirurgicale' },
    { id: 'desis', variants: ['desis', 'odese'], meaning: 'fixation chirurgicale' },
    { id: 'scopie', variants: ['scopie'], meaning: 'exploration visuelle' },
    { id: 'plegie', variants: ['plegie'], meaning: 'paralysie' },
    { id: 'paresie', variants: ['paresie'], meaning: 'faiblesse motrice' },
    { id: 'rraphie', variants: ['rraphie', 'raphie'], meaning: 'suture chirurgicale' },
  ],
  knownPathologyTerms: [
    'lombalgie',
    'cervicalgie',
    'dorsalgie',
    'myalgie',
    'névralgie',
    'brachialgie',
    'gonalgie',
    'coxalgie',
    'talalgie',
    'sciatalgie',
    'tendinite',
    'tendinopathie',
    'tendinose',
    'capsulite',
    'épicondylite',
    'bursite',
    'arthrite',
    'arthrose',
    'spondylarthrite',
    'spondylose',
    'coxarthrose',
    'gonarthrose',
    'cervicarthrose',
    'sacro-iliite',
    'périarthrite',
    'discopathie',
    'radiculopathie',
    'radiculalgie',
    'neuropathie',
    'myopathie',
    'arthropathie',
    'arthroplastie',
    'ligamentoplastie',
    'méniscectomie',
    'discectomie',
    'arthrodèse',
    'arthroscopie',
    'hémiplégie',
    'paraplégie',
    'entorse',
    'hernie',
    'hernie discale',
    'sciatique',
    'syndrome',
    'scoliose',
    'ostéoporose',
  ],
};

/** Convenience alias for tests and callers that only need the known-term list. */
export const KNOWN_PATHOLOGY_TERMS = MEDICAL_ROOT_DICTIONARY_SEED.knownPathologyTerms;
