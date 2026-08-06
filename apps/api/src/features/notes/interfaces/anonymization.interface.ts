export type AnonymizationEntityType =
  | 'EMAIL'
  | 'TELEPHONE'
  | 'NIR'
  | 'DATE'
  | 'ADRESSE'
  | 'NOM_CIVILITE'
  | 'CODE_POSTAL';

export interface AnonymizationRule {
  type: AnonymizationEntityType;
  pattern: RegExp;
}

export interface AnonymizationDetection {
  type: AnonymizationEntityType;
  count: number;
}

export interface AnonymizationResult {
  anonymizedText: string;
  detections: AnonymizationDetection[];
}
