import { describe, it, expect } from 'vitest';
import { escapeCsv } from '../utils/exportCsv';

describe('escapeCsv', () => {
  it('passes through a plain string unchanged', () => {
    expect(escapeCsv('Hello World')).toBe('Hello World');
  });

  it('wraps a string containing a comma in double-quotes', () => {
    expect(escapeCsv('Smith, John')).toBe('"Smith, John"');
  });

  it('wraps a string containing a double-quote and escapes it', () => {
    expect(escapeCsv('say "hello"')).toBe('"say ""hello"""');
  });

  it('wraps a string containing a newline', () => {
    expect(escapeCsv('line1\nline2')).toBe('"line1\nline2"');
  });

  it('converts a number to string', () => {
    expect(escapeCsv(42)).toBe('42');
  });

  it('converts a float to string', () => {
    expect(escapeCsv(3.14)).toBe('3.14');
  });

  it('converts null to empty string', () => {
    expect(escapeCsv(null)).toBe('');
  });

  it('converts undefined to empty string', () => {
    expect(escapeCsv(undefined)).toBe('');
  });

  it('handles an empty string without quoting', () => {
    expect(escapeCsv('')).toBe('');
  });

  it('handles a string with only spaces (no quoting needed)', () => {
    expect(escapeCsv('   ')).toBe('   ');
  });

  it('handles a string with both comma and quote', () => {
    // e.g.  He said, "hello"
    const result = escapeCsv('He said, "hello"');
    expect(result).toBe('"He said, ""hello"""');
  });
});
