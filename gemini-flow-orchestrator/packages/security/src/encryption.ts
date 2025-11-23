/**
 * AES-256-GCM Encryption Module
 * Based on OWASP best practices and Node.js crypto module
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import type { EncryptedData } from '@gemini-flow/shared-types';

const scryptAsync = promisify(scrypt);

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

export class EncryptionService {
  private masterKey: string;

  constructor(masterKey?: string) {
    this.masterKey = masterKey || process.env.ENCRYPTION_MASTER_KEY || '';

    if (!this.masterKey) {
      console.warn('⚠️  No master key provided. Using default (INSECURE for production!)');
      this.masterKey = 'default-insecure-key-change-me-in-production';
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   * Returns IV, encrypted data, and auth tag
   */
  async encrypt(plaintext: string): Promise<EncryptedData> {
    try {
      // Generate random salt and IV
      const salt = randomBytes(SALT_LENGTH);
      const iv = randomBytes(IV_LENGTH);

      // Derive encryption key from master key using scrypt
      const key = (await scryptAsync(this.masterKey, salt, KEY_LENGTH)) as Buffer;

      // Create cipher
      const cipher = createCipheriv(ALGORITHM, key, iv);

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag.toString('hex'),
        salt: salt.toString('hex'),
      } as EncryptedData & { salt: string };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data encrypted with AES-256-GCM
   */
  async decrypt(encryptedData: EncryptedData & { salt: string }): Promise<string> {
    try {
      // Convert hex strings back to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      const salt = Buffer.from(encryptedData.salt, 'hex');

      // Derive the same key
      const key = (await scryptAsync(this.masterKey, salt, KEY_LENGTH)) as Buffer;

      // Create decipher
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt an object (converts to JSON first)
   */
  async encryptObject<T>(obj: T): Promise<EncryptedData & { salt: string }> {
    const json = JSON.stringify(obj);
    return this.encrypt(json);
  }

  /**
   * Decrypt to an object (parses JSON after decryption)
   */
  async decryptObject<T>(encryptedData: EncryptedData & { salt: string }): Promise<T> {
    const json = await this.decrypt(encryptedData);
    return JSON.parse(json) as T;
  }

  /**
   * Generate a secure random token
   */
  static generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data (one-way, for comparison only)
   */
  static async hash(data: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const key = (await scryptAsync(data, salt, KEY_LENGTH)) as Buffer;
    return `${salt.toString('hex')}:${key.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  static async verifyHash(data: string, hash: string): Promise<boolean> {
    const [saltHex, keyHex] = hash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const originalKey = Buffer.from(keyHex, 'hex');

    const derivedKey = (await scryptAsync(data, salt, KEY_LENGTH)) as Buffer;

    return originalKey.equals(derivedKey);
  }
}

/**
 * Singleton instance
 */
export const encryption = new EncryptionService();
