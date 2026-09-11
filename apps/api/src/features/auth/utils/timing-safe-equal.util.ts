import { createHash, timingSafeEqual } from 'crypto';

/** Hash both sides to 32 bytes first: crypto.timingSafeEqual throws (and would leak) on length mismatch. */
export function timingSafeStringEqual(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}
