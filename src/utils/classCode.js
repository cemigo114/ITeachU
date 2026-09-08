// Live-session class codes, ported from gap-finder's src/lib/domain/class-code.ts.
// Format is HALF + "-" + HALF over a no-confusing-characters alphabet (no 0 O 1 I),
// e.g. "K7P-2QM". Used to mint and validate the code a student types on the join screen.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const HALF = 3;

function randomChars(rand, n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    s += ALPHABET[Math.floor(rand() * ALPHABET.length) % ALPHABET.length];
  }
  return s;
}

/** Generate a single class code, e.g. "K7P-2QM". */
export function generateClassCode(rand = Math.random) {
  const s = randomChars(rand, HALF * 2);
  return `${s.slice(0, HALF)}-${s.slice(HALF)}`;
}

/** True when `code` is exactly XXX-XXX over the code alphabet. */
export function isValidClassCodeFormat(code) {
  return new RegExp(`^[${ALPHABET}]{${HALF}}-[${ALPHABET}]{${HALF}}$`).test(code);
}

/** Normalize user input: uppercase, drop non-alphanumerics, re-insert the hyphen. */
export function normalizeClassCode(input) {
  const cleaned = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return cleaned.length === HALF * 2
    ? `${cleaned.slice(0, HALF)}-${cleaned.slice(HALF)}`
    : cleaned;
}

/**
 * Generate a code that doesn't already exist, retrying on collision.
 * @param {(code: string) => Promise<boolean>} exists
 * @param {() => number} [rand]
 */
export async function generateUniqueClassCode(exists, rand = Math.random) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateClassCode(rand);
    if (!(await exists(code))) return code;
  }
  throw new Error('Could not generate a unique class code after 10 attempts');
}
