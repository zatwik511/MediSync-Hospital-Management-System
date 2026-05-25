import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeTime } from '../utils/time';

describe('formatRelativeTime', () => {
  let now: number;

  beforeEach(() => {
    now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Never" for null', () => {
    expect(formatRelativeTime(null)).toBe('Never');
  });

  it('returns "Never" for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('Never');
  });

  it('returns "just now" for < 1 minute ago', () => {
    const ts = new Date(now - 30_000).toISOString(); // 30 seconds ago
    expect(formatRelativeTime(ts)).toBe('just now');
  });

  it('returns "1 minute ago" for exactly 1 minute ago', () => {
    const ts = new Date(now - 60_000).toISOString();
    expect(formatRelativeTime(ts)).toBe('1 minute ago');
  });

  it('returns "X minutes ago" (plural) for > 1 minute', () => {
    const ts = new Date(now - 5 * 60_000).toISOString(); // 5 minutes ago
    expect(formatRelativeTime(ts)).toBe('5 minutes ago');
  });

  it('returns "1 hour ago" (singular) for exactly 1 hour', () => {
    const ts = new Date(now - 60 * 60_000).toISOString();
    expect(formatRelativeTime(ts)).toBe('1 hour ago');
  });

  it('returns "X hours ago" (plural) for multiple hours', () => {
    const ts = new Date(now - 3 * 60 * 60_000).toISOString(); // 3 hours ago
    expect(formatRelativeTime(ts)).toBe('3 hours ago');
  });

  it('returns "1 day ago" (singular) for exactly 1 day', () => {
    const ts = new Date(now - 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(ts)).toBe('1 day ago');
  });

  it('returns "X days ago" (plural) for multiple days under 7', () => {
    const ts = new Date(now - 3 * 24 * 60 * 60_000).toISOString(); // 3 days ago
    expect(formatRelativeTime(ts)).toBe('3 days ago');
  });

  it('returns a formatted date string for >= 7 days ago', () => {
    const ts = new Date(now - 10 * 24 * 60 * 60_000).toISOString(); // 10 days ago
    const result = formatRelativeTime(ts);
    // Should be a locale date string, not a relative string
    expect(result).not.toMatch(/ago/);
    expect(result).not.toBe('Never');
    expect(result).not.toBe('just now');
  });
});
