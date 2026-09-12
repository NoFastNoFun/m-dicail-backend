import { NotesService } from './notes.service';
import { GroqSoapService } from './groq-soap.service';

describe('NotesService', () => {
  let groqSoap: jest.Mocked<GroqSoapService>;
  let service: NotesService;

  beforeEach(() => {
    groqSoap = { generate: jest.fn() } as unknown as jest.Mocked<GroqSoapService>;
    service = new NotesService(groqSoap);
  });

  it('returns session_id and processed_text equal to raw_text', async () => {
    groqSoap.generate.mockResolvedValue({ subjective: '', objective: '', assessment: '', plan: '', other: '' });

    const result = await service.process({ session_id: 'abc', raw_text: 'bonjour', language: 'fr' });

    expect(result.session_id).toBe('abc');
    expect(result.processed_text).toBe('bonjour');
  });

  it('delegates soap_note generation to GroqSoapService with transcript and language', async () => {
    const soapNote = { subjective: 's', objective: 'o', assessment: 'a', plan: 'p', other: '' };
    groqSoap.generate.mockResolvedValue(soapNote);

    const result = await service.process({ session_id: 'abc', raw_text: 'douleur au genou', language: 'fr' });

    expect(groqSoap.generate).toHaveBeenCalledWith({ transcript: 'douleur au genou', language: 'fr' });
    expect(result.soap_note).toBe(soapNote);
  });

  it("defaults language to 'fr' when omitted", async () => {
    groqSoap.generate.mockResolvedValue({ subjective: '', objective: '', assessment: '', plan: '', other: '' });

    await service.process({ session_id: 'abc', raw_text: 'texte', language: undefined as unknown as string });

    expect(groqSoap.generate).toHaveBeenCalledWith({ transcript: 'texte', language: 'fr' });
  });
});
