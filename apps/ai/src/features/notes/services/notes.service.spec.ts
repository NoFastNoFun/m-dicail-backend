import { NotesService } from './notes.service';
import { GroqSoapService } from './groq-soap.service';

describe('NotesService', () => {
  let groqSoap: jest.Mocked<GroqSoapService>;
  let service: NotesService;

  beforeEach(() => {
    groqSoap = { generate: jest.fn() } as unknown as jest.Mocked<GroqSoapService>;
    service = new NotesService(groqSoap);
  });

  it('renvoie session_id et processed_text identique au raw_text', async () => {
    groqSoap.generate.mockResolvedValue({ subjective: '', objective: '', assessment: '', plan: '', other: '' });

    const result = await service.process({ session_id: 'abc', raw_text: 'bonjour', language: 'fr' });

    expect(result.session_id).toBe('abc');
    expect(result.processed_text).toBe('bonjour');
  });

  it('delegue la generation du soap_note au GroqSoapService avec le transcript et la langue', async () => {
    const soapNote = { subjective: 's', objective: 'o', assessment: 'a', plan: 'p', other: '' };
    groqSoap.generate.mockResolvedValue(soapNote);

    const result = await service.process({ session_id: 'abc', raw_text: 'douleur au genou', language: 'fr' });

    expect(groqSoap.generate).toHaveBeenCalledWith({ transcript: 'douleur au genou', language: 'fr' });
    expect(result.soap_note).toBe(soapNote);
  });

  it("utilise 'fr' par defaut quand la langue n'est pas fournie", async () => {
    groqSoap.generate.mockResolvedValue({ subjective: '', objective: '', assessment: '', plan: '', other: '' });

    await service.process({ session_id: 'abc', raw_text: 'texte', language: undefined as unknown as string });

    expect(groqSoap.generate).toHaveBeenCalledWith({ transcript: 'texte', language: 'fr' });
  });
});
