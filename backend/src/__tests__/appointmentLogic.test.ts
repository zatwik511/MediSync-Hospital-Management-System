import {
  assertTransition,
  ALLOWED_TRANSITIONS,
  parseLocalDayOfWeek,
  generateSlots,
} from '../services/AppointmentService';

// ── assertTransition ─────────────────────────────────────────────────────────

describe('assertTransition', () => {
  // Valid forward transitions
  it.each([
    ['Pending',   'Confirmed'],
    ['Pending',   'Cancelled'],
    ['Confirmed', 'Completed'],
    ['Confirmed', 'Cancelled'],
  ])('allows %s → %s', (from, to) => {
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  // Invalid / disallowed transitions
  it.each([
    ['Pending',   'Completed'],   // must be Confirmed first
    ['Completed', 'Cancelled'],   // terminal
    ['Completed', 'Confirmed'],   // terminal
    ['Cancelled', 'Confirmed'],   // terminal
    ['Cancelled', 'Pending'],     // terminal
  ])('rejects %s → %s', (from, to) => {
    expect(() => assertTransition(from, to)).toThrow(/Cannot transition/);
  });

  it('rejects an unknown source status', () => {
    expect(() => assertTransition('Unknown', 'Confirmed')).toThrow(/Cannot transition/);
  });

  it('error message lists allowed transitions for non-terminal states', () => {
    try {
      assertTransition('Pending', 'Completed');
    } catch (e) {
      expect((e as Error).message).toMatch(/Confirmed/);
    }
  });

  it('error message says "No further transitions" for terminal states', () => {
    try {
      assertTransition('Completed', 'Cancelled');
    } catch (e) {
      expect((e as Error).message).toMatch(/No further transitions/);
    }
  });

  it('ALLOWED_TRANSITIONS has exactly the four expected statuses', () => {
    expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual(
      ['Cancelled', 'Completed', 'Confirmed', 'Pending']
    );
  });
});

// ── parseLocalDayOfWeek ──────────────────────────────────────────────────────

describe('parseLocalDayOfWeek', () => {
  // Verified against a calendar: 2026-05-25 is Monday
  it('returns 1 for Monday 2026-05-25', () => {
    expect(parseLocalDayOfWeek('2026-05-25')).toBe(1);
  });

  it('returns 0 for Sunday 2026-05-24', () => {
    expect(parseLocalDayOfWeek('2026-05-24')).toBe(0);
  });

  it('returns 6 for Saturday 2026-05-30', () => {
    expect(parseLocalDayOfWeek('2026-05-30')).toBe(6);
  });

  it('returns 5 for Friday 2026-05-29', () => {
    expect(parseLocalDayOfWeek('2026-05-29')).toBe(5);
  });

  it('uses local date constructor to avoid UTC midnight off-by-one', () => {
    // "2026-01-01" parsed as UTC midnight can become Dec 31 in UTC+X negative offsets.
    // parseLocalDayOfWeek uses new Date(y, m-1, d) (local) so it is always Jan 1.
    const result = parseLocalDayOfWeek('2026-01-01');
    // Jan 1 2026 = Thursday (4)
    expect(result).toBe(4);
  });
});

// ── generateSlots ────────────────────────────────────────────────────────────

describe('generateSlots', () => {
  it('generates correct 30-min slots for a 1.5-hour window', () => {
    expect(generateSlots('09:00', '10:30')).toEqual(['09:00', '09:30', '10:00']);
  });

  it('generates exactly one slot for a 30-minute window', () => {
    expect(generateSlots('14:00', '14:30')).toEqual(['14:00']);
  });

  it('returns empty array when start equals end', () => {
    expect(generateSlots('09:00', '09:00')).toEqual([]);
  });

  it('returns empty array when end is before start', () => {
    expect(generateSlots('17:00', '09:00')).toEqual([]);
  });

  it('pads single-digit hours and minutes with leading zeros', () => {
    const slots = generateSlots('08:00', '09:30');
    expect(slots).toContain('08:00');
    expect(slots).toContain('08:30');
    expect(slots).toContain('09:00');
    expect(slots).not.toContain('09:30');
  });

  it('generates the 12 default slots (08:30 – 16:30)', () => {
    const slots = generateSlots('08:30', '16:30');
    expect(slots).toHaveLength(16);
    expect(slots[0]).toBe('08:30');
    expect(slots[slots.length - 1]).toBe('16:00');
  });

  it('slot strings are always HH:MM format', () => {
    const slots = generateSlots('08:00', '10:00');
    for (const s of slots) {
      expect(s).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});
