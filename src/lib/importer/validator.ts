import type { RawRow, RowError, ValidRow } from './types';

const REQUIRED_FIELDS = [
  'Number',
  'Name',
  'Brand',
  'Release_Year',
  'Concentration',
  'Rating_Value',
  'Rating_Count',
  'Main_Accords',
  'Top_Notes',
  'Middle_Notes',
  'Base_Notes',
  'Perfumers',
  'URL',
] as const;

export function validateRows(rows: RawRow[]): {
  valid: ValidRow[];
  errors: RowError[];
} {
  const valid: ValidRow[] = [];
  const errors: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    let rowValid = true;

    for (const field of REQUIRED_FIELDS) {
      const value = row[field];

      if (value === undefined || value === null || value.trim() === '') {
        errors.push({
          rowNumber,
          field,
          reason: `Missing required field: ${field}`,
          rawRow: row,
        });
        rowValid = false;
      }
    }

    if (rowValid) {
      valid.push({
        rowNumber,
        data: row as Record<string, string>,
      });
    }
  }

  return { valid, errors };
}
