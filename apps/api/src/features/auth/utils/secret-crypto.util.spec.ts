import { encryptSecret, decryptSecret } from './secret-crypto.util';

describe('secret-crypto', () => {
  const secretKey = 'unit-test-secret-key-32-chars!!';

  it('round-trips plaintext', () => {
    const ciphertext = encryptSecret('totp-secret', secretKey);
    expect(decryptSecret(ciphertext, secretKey)).toBe('totp-secret');
  });

  it('rejects truncated ciphertext', () => {
    expect(() => decryptSecret('YQ==', secretKey)).toThrow('Invalid ciphertext');
  });
});
