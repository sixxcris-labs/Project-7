import crypto from 'node:crypto';

export const signPayload = (secret: string, payload: string): string => {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};
