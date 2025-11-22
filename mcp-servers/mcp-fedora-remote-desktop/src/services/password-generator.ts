/**
 * Générateur de mots de passe sécurisés
 */

import { randomBytes } from "crypto";
import { SECURITY_POLICIES } from "../config/security-policies.js";

export class PasswordGenerator {
  /**
   * Génère un mot de passe sécurisé
   */
  generate(length: number = SECURITY_POLICIES.PASSWORD_POLICY.minLength): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}";
    const random = randomBytes(length);
    let password = "";

    for (let i = 0; i < length; i++) {
      password += charset[random[i] % charset.length];
    }

    // Garantir la complexité
    if (!this.isStrong(password).strong) {
      return this.generate(length); // Régénérer
    }

    return password;
  }

  /**
   * Valide la force d'un mot de passe
   */
  isStrong(password: string): { strong: boolean; reason?: string } {
    const { minLength, requireComplexity } = SECURITY_POLICIES.PASSWORD_POLICY;

    if (password.length < minLength) {
      return { strong: false, reason: `Trop court (min ${minLength} caractères)` };
    }

    if (requireComplexity) {
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}]/.test(password);

      if (!(hasUpper && hasLower && hasDigit && hasSpecial)) {
        return {
          strong: false,
          reason:
            "Doit contenir majuscules, minuscules, chiffres et caractères spéciaux",
        };
      }
    }

    return { strong: true };
  }
}

export const passwordGenerator = new PasswordGenerator();
