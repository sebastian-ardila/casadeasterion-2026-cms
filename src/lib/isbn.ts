/**
 * Normalize and validate ISBN-10 / ISBN-13 strings entered in the CMS.
 *
 * Accepts both formats with or without dashes/spaces. Storing the
 * normalized form (digits only, X uppercase for ISBN-10 check digit) means
 * '978-3-16-148410-0' and '9783161484100' collide on the unique index, so
 * we don't get duplicates that look different.
 *
 * Note: we don't verify the check digit. That's stricter than necessary
 * for a small editorial CMS — the constraint we care about is "two rows
 * with the same ISBN aren't allowed." A typo will fail to validate at the
 * length/character level anyway.
 */

export function normalizeISBN(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = input.replace(/[^0-9Xx]/g, "").toUpperCase();
  return cleaned || null;
}

export function isValidISBN(input: string | null | undefined): boolean {
  const n = normalizeISBN(input);
  if (!n) return true; // empty is allowed (column is nullable)
  // ISBN-10: 9 digits + check (digit or X). ISBN-13: 13 digits, no X allowed.
  if (n.length === 10) return /^\d{9}[\dX]$/.test(n);
  if (n.length === 13) return /^\d{13}$/.test(n);
  return false;
}
