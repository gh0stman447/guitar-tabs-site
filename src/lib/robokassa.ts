import { createHash, timingSafeEqual } from 'crypto';

const SUPPORTED_HASH_ALGORITHMS = new Set([
  'md5',
  'ripemd160',
  'sha1',
  'sha256',
  'sha384',
  'sha512',
]);

function getHashAlgorithm() {
  const algorithm = (process.env.ROBOKASSA_HASH_ALGORITHM ?? 'md5').toLowerCase();

  if (!SUPPORTED_HASH_ALGORITHMS.has(algorithm)) {
    throw new Error(`Unsupported ROBOKASSA_HASH_ALGORITHM: ${algorithm}`);
  }

  return algorithm;
}

export function createRobokassaHash(value: string) {
  return createHash(getHashAlgorithm()).update(value, 'utf8').digest('hex');
}

export function verifyRobokassaHash(value: string, receivedHash: string) {
  const expected = Buffer.from(createRobokassaHash(value).toLowerCase(), 'utf8');
  const received = Buffer.from(receivedHash.toLowerCase(), 'utf8');

  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function getRobokassaConfig() {
  const merchantLogin = process.env.ROBOKASSA_MERCHANT_LOGIN;
  const password1 = process.env.ROBOKASSA_PASSWORD_1;
  const password2 = process.env.ROBOKASSA_PASSWORD_2;

  if (!merchantLogin || !password1 || !password2) {
    throw new Error('Robokassa credentials are not configured');
  }

  return {
    merchantLogin,
    password1,
    password2,
    isTest: process.env.ROBOKASSA_TEST_MODE !== 'false',
  };
}
