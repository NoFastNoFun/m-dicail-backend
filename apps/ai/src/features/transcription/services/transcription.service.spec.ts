import { BadRequestException } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { WhisperClientService } from './whisper-client.service';
import { UploadedAudioFile } from '../interfaces/uploaded-audio-file.interface';

describe('TranscriptionService', () => {
  const whisperClient = {
    transcribeFile: jest.fn(),
  } as unknown as WhisperClientService;

  const service = new TranscriptionService(whisperClient);

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

  it('returns whisper text and cleans temp file path flow', async () => {
    (whisperClient.transcribeFile as jest.Mock).mockResolvedValue('Bonjour');
    const file: UploadedAudioFile = {
      buffer: Buffer.from('RIFF'),
      originalname: 'consult.wav',
      mimetype: 'audio/wav',
      size: 4,
    };

    await expect(service.transcribe({ file, language: 'fr', sessionId: 's1' })).resolves.toEqual({
      text: 'Bonjour',
    });
    expect(whisperClient.transcribeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        originalName: 'consult.wav',
        mimeType: 'audio/wav',
        language: 'fr',
      }),
    );
  });
});
