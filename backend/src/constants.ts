// Role → staff code prefix mapping.
// If updated here, also update the SQL CASE expression in runMigration.ts.
export const ROLE_PREFIX: Record<string, string> = {
  doctor:       'DOC',
  admin:        'ADM',
  receptionist: 'REC',
  radiologist:  'RAD',
};

export const ROLE_PREFIX_DEFAULT = 'STF';
