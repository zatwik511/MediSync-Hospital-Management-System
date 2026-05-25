const VALID_SEVERITIES = new Set<string>(['Mild', 'Moderate', 'Severe', 'Life-threatening']);

interface AllergyLike {
  substance: string;
  reaction: string;
  severity: string;
}

export function validateConditions(conditions: string[]): void {
  if (!Array.isArray(conditions)) throw new Error('conditions must be an array');
  for (const c of conditions) {
    if (typeof c !== 'string' || c.trim() === '') throw new Error('Each condition must be a non-empty string');
    if (c.length > 255) throw new Error('Each condition must be 255 characters or fewer');
  }
}

export function validateAllergies(allergies: AllergyLike[]): void {
  if (!Array.isArray(allergies)) throw new Error('allergies must be an array');
  for (const a of allergies) {
    if (typeof a.substance !== 'string' || a.substance.trim() === '') throw new Error('Each allergy must have a non-empty substance');
    if (a.substance.length > 255) throw new Error('Allergy substance must be 255 characters or fewer');
    if (typeof a.reaction !== 'string' || a.reaction.trim() === '') throw new Error('Each allergy must have a non-empty reaction');
    if (a.reaction.length > 500) throw new Error('Allergy reaction must be 500 characters or fewer');
    if (!VALID_SEVERITIES.has(a.severity)) throw new Error(`Allergy severity must be one of: ${[...VALID_SEVERITIES].join(', ')}`);
  }
}
