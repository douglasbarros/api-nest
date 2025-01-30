import { createCipheriv, createDecipheriv, scrypt } from 'crypto';
import { promisify } from 'util';
import * as bcrypt from 'bcrypt';

export class EncryptUtils {
  static encSecret = process.env.ENC_SECRET;
  static iv = Buffer.alloc(16, 'aJNjasuyuU2134Wz', 'ascii');

  static async encrypt(decryptedPayload: string) {
    const key = (await promisify(scrypt)(this.encSecret, 'salt', 32)) as Buffer;
    const cipher = createCipheriv('aes-256-ctr', key, this.iv);

    const encryptedPayload = Buffer.concat([
      cipher.update(decryptedPayload),
      cipher.final(),
    ]);
    return encryptedPayload;
  }

  static async decrypt(encryptedPayload: Buffer) {
    const key = (await promisify(scrypt)(this.encSecret, 'salt', 32)) as Buffer;
    const decipher = createDecipheriv('aes-256-ctr', key, this.iv);
    const decryptedPayload = Buffer.concat([
      decipher.update(Buffer.from(encryptedPayload)),
      decipher.final(),
    ]);
    return decryptedPayload.toString();
  }

  static async encryptPass(password: string) {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}
