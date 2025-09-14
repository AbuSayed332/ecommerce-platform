import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export class PasswordUtil {
  private static readonly SALT_ROUNDS = 12;
  private static readonly PASSWORD_MIN_LENGTH = 6;
  private static readonly PASSWORD_MAX_LENGTH = 128;

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    this.validatePassword(password);
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare a plain password with a hashed password
   */
  static async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generate a random password
   */
  static generateRandomPassword(length: number = 12): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Generate a secure reset token
   */
  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push('Password should be at least 8 characters long');
    } else if (password.length >= 8) {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain uppercase letters');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain numbers');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain special characters');
    }

    // Common patterns check
    if (this.hasCommonPatterns(password)) {
      score -= 1;
      feedback.push('Avoid common patterns like "123", "abc", or "password"');
    }

    return {
      isValid: score >= 4 && feedback.length === 0,
      score: Math.max(0, Math.min(5, score)),
      feedback,
    };
  }

  /**
   * Hash a token for secure storage
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate email verification token
   */
  static generateVerificationToken(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  private static validatePassword(password: string): void {
    if (!password) {
      throw new Error('Password is required');
    }

    if (password.length < this.PASSWORD_MIN_LENGTH) {
      throw new Error(
        `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`,
      );
    }

    if (password.length > this.PASSWORD_MAX_LENGTH) {
      throw new Error(
        `Password must not exceed ${this.PASSWORD_MAX_LENGTH} characters`,
      );
    }
  }

  private static hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }
}
