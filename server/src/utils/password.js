import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !password) return false;
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const hashBuffer = Buffer.from(hash, 'hex');
  const test = scryptSync(password, salt, 64);
  if (hashBuffer.length !== test.length) return false;
  return timingSafeEqual(hashBuffer, test);
}
