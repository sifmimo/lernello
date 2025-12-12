import { encryptApiKey, decryptApiKey } from '@/lib/ai/encryption';

describe('AI Encryption', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ENCRYPTION_KEY: 'test-encryption-key-32-chars!!!' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('encryptApiKey and decryptApiKey', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const originalText = 'sk-test-api-key-12345';
      
      const encrypted = encryptApiKey(originalText);
      expect(encrypted).not.toBe(originalText);
      
      const decrypted = decryptApiKey(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const text = 'same-text';
      
      const encrypted1 = encryptApiKey(text);
      const encrypted2 = encryptApiKey(text);
      
      expect(encrypted1).not.toBe(encrypted2);
    });
  });
});
