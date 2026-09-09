import { BadRequestException } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { GroqClientService } from './groq-client.service';
import { UploadedAudioFile } from '../interfaces/uploaded-audio-file.interface';

describe('TranscriptionService', () => {
  const groqClient = {
    transcribeFile: jest.fn(),
  } as unknown as GroqClientService;

  const service = new TranscriptionService(groqClient);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects missing upload', async () => {
    await expect(
      service.transcribe({
        file: undefined as unknown as UploadedAudioFile,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns groq text and cleans temp file path flow', async () => {
    (groqClient.transcribeFile as jest.Mock).mockResolvedValue('Bonjour');
    const file: UploadedAudioFile = {
      buffer: Buffer.from('RIFF'),
      originalname: 'consult.wav',
      mimetype: 'audio/wav',
      size: 4,
    };

    await expect(service.transcribe({ file, language: 'fr', sessionId: 's1' })).resolves.toEqual({
      text: 'Bonjour',
    });
    expect(groqClient.transcribeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        originalName: 'consult.wav',
        mimeType: 'audio/wav',
        language: 'fr',
      }),
    );
  });
});
