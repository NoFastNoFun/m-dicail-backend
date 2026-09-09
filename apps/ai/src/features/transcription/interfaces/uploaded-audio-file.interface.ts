import type { Readable } from 'node:stream';

/** Subset of Multer's uploaded file shape used by transcription. */
export interface UploadedAudioFile {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  path?: string;
  stream?: Readable;
}
