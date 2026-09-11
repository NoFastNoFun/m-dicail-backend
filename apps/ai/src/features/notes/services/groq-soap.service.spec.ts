import { BadGatewayException, GatewayTimeoutException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroqSoapService } from './groq-soap.service';

describe('GroqSoapService', () => {
  let service: GroqSoapService;
  let configGet: jest.Mock;

  beforeEach(() => {
    configGet = jest.fn((key: string) => {
      if (key === 'GROQ_BASE_URL') return undefined;
      if (key === 'GROQ_SOAP_MODEL') return undefined;
      if (key === 'GROQ_TIMEOUT_MS') return undefined;
      return undefined;
    });

    const config = {
      getOrThrow: (key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key';
        throw new Error(`unexpected key ${key}`);
      },
      get: configGet,
    } as unknown as ConfigService;

    service = new GroqSoapService(config);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the transcript to Groq chat completions with JSON response format', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                subjective: 's',
                objective: 'o',
                assessment: 'a',
                plan: 'p',
                other: '',
              }),
            },
          },
        ],
      }),
    });

    await service.generate({ transcript: "j'ai mal au genou", language: 'fr' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        }),
      }),
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string);
    expect(body.model).toBe('openai/gpt-oss-120b');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[1]).toEqual({ role: 'user', content: "j'ai mal au genou" });
  });

  it('returns the parsed SOAP note from the model response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                subjective: 'douleur au genou depuis 2 semaines',
                objective: 'flexion limitee a 90 degres',
                assessment: 'gonalgie mecanique',
                plan: '8 seances de kinesitherapie',
                other: '',
              }),
            },
          },
        ],
      }),
    });

    const result = await service.generate({ transcript: 'texte', language: 'fr' });

    expect(result).toEqual({
      subjective: 'douleur au genou depuis 2 semaines',
      objective: 'flexion limitee a 90 degres',
      assessment: 'gonalgie mecanique',
      plan: '8 seances de kinesitherapie',
      other: '',
    });
  });

  it('throws BadGatewayException when Groq responds with an error status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });

    await expect(service.generate({ transcript: 'texte', language: 'fr' })).rejects.toThrow(BadGatewayException);
  });

  it('throws BadGatewayException when the model response is not valid SOAP JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json' } }] }),
    });

    await expect(service.generate({ transcript: 'texte', language: 'fr' })).rejects.toThrow(BadGatewayException);
  });

  it('throws BadGatewayException when the model response is missing SOAP keys', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify({ subjective: 's' }) } }] }),
    });

    await expect(service.generate({ transcript: 'texte', language: 'fr' })).rejects.toThrow(BadGatewayException);
  });

  it('throws GatewayTimeoutException when the request times out', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    (global.fetch as jest.Mock).mockRejectedValue(abortError);

    await expect(service.generate({ transcript: 'texte', language: 'fr' })).rejects.toThrow(GatewayTimeoutException);
  });

  it('throws ServiceUnavailableException on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    await expect(service.generate({ transcript: 'texte', language: 'fr' })).rejects.toThrow(ServiceUnavailableException);
  });
});
