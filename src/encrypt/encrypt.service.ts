import { Injectable } from '@nestjs/common';
import { EncryptUtils } from 'src/utils/encrypt.utils';

@Injectable()
export class EncryptService {
  encSecret = process.env.ENC_SECRET;
  iv = Buffer.alloc(16, 'a', 'ascii');

  async encrypt(decryptedPayload: string) {
    return EncryptUtils.encrypt(decryptedPayload);
  }

  async decrypt(encryptedPayload: Buffer) {
    return EncryptUtils.decrypt(encryptedPayload);
  }
}
