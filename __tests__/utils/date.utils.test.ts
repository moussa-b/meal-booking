import { describe, expect, it } from 'vitest';
import { sanitizeForFilename } from '@/lib/utils/date.utils';

describe('sanitizeForFilename', () => {
  it('should remove accents and keep base letters, lowercased', () => {
    expect(sanitizeForFilename('École')).toBe('ecole');
    expect(sanitizeForFilename('déjà')).toBe('deja');
    expect(sanitizeForFilename('ÀÇÛ')).toBe('acu');
  });

  it('should handle complex organization names with spaces and punctuation', () => {
    const input = 'École privée Transmettre - 2026/2027 (Secteur A)';
    const result = sanitizeForFilename(input);
    expect(result).toBe('ecole_privee_transmettre_20262027_secteur_a');
  });

  it('should collapse multiple invalid characters into single underscores and trim', () => {
    const input = '  École--privée!!  ';
    const result = sanitizeForFilename(input);
    expect(result).toBe('ecole_privee');
  });

  it('should return empty string for empty or falsy input', () => {
    expect(sanitizeForFilename('')).toBe('');
    // @ts-expect-error - testing runtime behavior with undefined
    expect(sanitizeForFilename(undefined)).toBe('');
  });
});
