export type AnonymizationEntityType =
  | 'EMAIL'
  | 'TELEPHONE'
  | 'NIR'
  | 'DATE'
  | 'ADRESSE'
  | 'NOM_CIVILITE'
  | 'NOM_TITRE'
  | 'NOM_PATIENT'
  | 'CODE_POSTAL'
  | 'NOM'
  | 'MRN';

export interface AnonymizationRule {
  type: AnonymizationEntityType;
  pattern: RegExp;
  /** Keep the honorific/prefix (Monsieur, Dr, le patient) and only replace the name. */
  keepGroup0?: boolean;
}

export interface KnownPatientIdentifiers {
  firstName?: string | null;
  lastName?: string | null;
  mrn?: string | null;
  birthDate?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface AnonymizationDetection {
  type: AnonymizationEntityType;
  count: number;
}

export interface AnonymizationResult {
  anonymizedText: string;
  detections: AnonymizationDetection[];
}
