/**
 * Credential Manager
 * Securely stores and retrieves encrypted credentials
 */

import type { Credential, CredentialTypeDefinition } from '@gemini-flow/shared-types';
import { EncryptionService } from './encryption';

export class CredentialManager {
  private encryption: EncryptionService;
  private credentialTypes: Map<string, CredentialTypeDefinition>;

  constructor(masterKey?: string) {
    this.encryption = new EncryptionService(masterKey);
    this.credentialTypes = new Map();
    this.registerDefaultTypes();
  }

  /**
   * Register default credential types
   */
  private registerDefaultTypes(): void {
    // API Key
    this.registerCredentialType({
      name: 'apiKey',
      displayName: 'API Key',
      properties: [
        {
          displayName: 'API Key',
          name: 'apiKey',
          type: 'string',
          default: '',
          required: true,
        },
      ],
    });

    // OAuth2
    this.registerCredentialType({
      name: 'oauth2',
      displayName: 'OAuth2',
      properties: [
        {
          displayName: 'Client ID',
          name: 'clientId',
          type: 'string',
          default: '',
          required: true,
        },
        {
          displayName: 'Client Secret',
          name: 'clientSecret',
          type: 'string',
          default: '',
          required: true,
        },
        {
          displayName: 'Access Token',
          name: 'accessToken',
          type: 'string',
          default: '',
        },
        {
          displayName: 'Refresh Token',
          name: 'refreshToken',
          type: 'string',
          default: '',
        },
      ],
    });

    // Basic Auth
    this.registerCredentialType({
      name: 'basicAuth',
      displayName: 'Basic Auth',
      properties: [
        {
          displayName: 'Username',
          name: 'username',
          type: 'string',
          default: '',
          required: true,
        },
        {
          displayName: 'Password',
          name: 'password',
          type: 'string',
          default: '',
          required: true,
        },
      ],
    });

    // Bearer Token
    this.registerCredentialType({
      name: 'bearer',
      displayName: 'Bearer Token',
      properties: [
        {
          displayName: 'Token',
          name: 'token',
          type: 'string',
          default: '',
          required: true,
        },
      ],
    });
  }

  /**
   * Register a new credential type
   */
  registerCredentialType(type: CredentialTypeDefinition): void {
    this.credentialTypes.set(type.name, type);
  }

  /**
   * Get credential type definition
   */
  getCredentialType(name: string): CredentialTypeDefinition | undefined {
    return this.credentialTypes.get(name);
  }

  /**
   * List all credential types
   */
  listCredentialTypes(): CredentialTypeDefinition[] {
    return Array.from(this.credentialTypes.values());
  }

  /**
   * Encrypt credential data
   */
  async encryptCredential(credentialData: Record<string, any>): Promise<any> {
    return this.encryption.encryptObject(credentialData);
  }

  /**
   * Decrypt credential data
   */
  async decryptCredential(encryptedData: any): Promise<Record<string, any>> {
    return this.encryption.decryptObject(encryptedData);
  }

  /**
   * Create a new credential (in real app, this would save to database)
   */
  async createCredential(
    name: string,
    type: string,
    data: Record<string, any>
  ): Promise<Partial<Credential>> {
    // Validate type exists
    const credentialType = this.credentialTypes.get(type);
    if (!credentialType) {
      throw new Error(`Unknown credential type: ${type}`);
    }

    // Validate required fields
    const requiredProps = credentialType.properties.filter(p => p.required);
    for (const prop of requiredProps) {
      if (!data[prop.name]) {
        throw new Error(`Missing required field: ${prop.displayName}`);
      }
    }

    // Encrypt the data
    const encryptedData = await this.encryptCredential(data);

    return {
      name,
      type,
      data: encryptedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get decrypted credential data
   */
  async getCredentialData(credential: Credential): Promise<Record<string, any>> {
    return this.decryptCredential(credential.data);
  }
}

/**
 * Singleton instance
 */
export const credentialManager = new CredentialManager();
