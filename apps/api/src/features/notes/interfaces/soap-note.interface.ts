export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  other: string;
}

export type SoapSection = keyof SoapNote;
