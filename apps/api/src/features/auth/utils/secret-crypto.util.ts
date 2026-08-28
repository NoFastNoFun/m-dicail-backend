import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function deriveKey(secretKey: string): Buffer {
  return createHash('sha256').update(secretKey).digest();
}

export function encryptSecret(plaintext: string, secretKey: string): string {
  const key = deriveKey(secretKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(ciphertext: string, secretKey: string): string {
  const buf = Buffer.from(ciphertext, 'base64');
  if (buf.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error('Invalid ciphertext');
  }

  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const key = deriveKey(secretKey);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
