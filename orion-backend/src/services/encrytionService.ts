import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export class EncryptionService {
  /**
   * Hash de password usando bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compara password con hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}