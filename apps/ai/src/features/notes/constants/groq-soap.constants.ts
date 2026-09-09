import { SoapSection } from '../interfaces/soap-note.interface';

export const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
export const DEFAULT_GROQ_SOAP_MODEL = 'openai/gpt-oss-120b';
export const DEFAULT_GROQ_TIMEOUT_MS = 120_000;

export const SOAP_SECTIONS: SoapSection[] = ['subjective', 'objective', 'assessment', 'plan', 'other'];
