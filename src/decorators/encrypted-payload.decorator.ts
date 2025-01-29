import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { EncryptUtils } from 'src/utils/encrypt.utils';

export const EncryptedPayload = createParamDecorator(
  async (_data: unknown, context: ExecutionContext) => {
    const data: Buffer = context.switchToHttp().getRequest().body;
    const decryptedPayload = await EncryptUtils.decrypt(data);
    return JSON.parse(decryptedPayload);
  },
);
