import { validateConditions, validateAllergies } from '../services/patientValidation';

// ── validateConditions ───────────────────────────────────────────────────────

describe('validateConditions', () => {
  it('accepts an empty array', () => {
    expect(() => validateConditions([])).not.toThrow();
  });

  it('accepts valid condition strings', () => {
    expect(() => validateConditions(['Diabetes', 'Hypertension'])).not.toThrow();
  });

  it('rejects a non-array value', () => {
    expect(() => validateConditions('Diabetes' as unknown as string[])).toThrow('conditions must be an array');
  });

  it('rejects an empty string', () => {
    expect(() => validateConditions([''])).toThrow('non-empty string');
  });

  it('rejects a whitespace-only string', () => {
    expect(() => validateConditions(['   '])).toThrow('non-empty string');
  });

  it('rejects a condition exceeding 255 characters', () => {
    expect(() => validateConditions(['a'.repeat(256)])).toThrow('255 characters');
  });

  it('accepts a condition of exactly 255 characters', () => {
    expect(() => validateConditions(['a'.repeat(255)])).not.toThrow();
  });

  it('rejects the first invalid condition in a mixed array', () => {
    expect(() => validateConditions(['Valid', ''])).toThrow('non-empty string');
  });
});

// ── validateAllergies ────────────────────────────────────────────────────────

const valid = { substance: 'Penicillin', reaction: 'Rash', severity: 'Mild' };

describe('validateAllergies', () => {
  it('accepts an empty array', () => {
    expect(() => validateAllergies([])).not.toThrow();
  });

  it('accepts a valid allergy entry', () => {
    expect(() => validateAllergies([valid])).not.toThrow();
  });

  it('accepts all four valid severity values', () => {
    const severities = ['Mild', 'Moderate', 'Severe', 'Life-threatening'];
    for (const severity of severities) {
      expect(() => validateAllergies([{ ...valid, severity }])).not.toThrow();
    }
  });

  it('rejects an empty substance', () => {
    expect(() => validateAllergies([{ ...valid, substance: '' }])).toThrow('substance');
  });

  it('rejects a whitespace-only substance', () => {
    expect(() => validateAllergies([{ ...valid, substance: '   ' }])).toThrow('substance');
  });

  it('rejects a substance exceeding 255 characters', () => {
    expect(() => validateAllergies([{ ...valid, substance: 'x'.repeat(256) }])).toThrow('255 characters');
  });

  it('rejects an empty reaction', () => {
    expect(() => validateAllergies([{ ...valid, reaction: '' }])).toThrow('reaction');
  });

  it('rejects a reaction exceeding 500 characters', () => {
    expect(() => validateAllergies([{ ...valid, reaction: 'r'.repeat(501) }])).toThrow('500 characters');
  });

  it('rejects an invalid severity value', () => {
    expect(() => validateAllergies([{ ...valid, severity: 'Unknown' }])).toThrow('severity');
  });

  it('rejects a non-array value', () => {
    expect(() => validateAllergies(valid as unknown as Parameters<typeof validateAllergies>[0])).toThrow('allergies must be an array');
  });
});
