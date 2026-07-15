import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import type { RawRow } from './types';

const EXPECTED_COLUMNS = [
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
];

export async function parseCsv(filePath: string): Promise<{
  rows: AsyncGenerator<RawRow>;
  headers: string[];
}> {
  let headers: string[] = [];
  let headersResolved = false;

  const stream = createReadStream(filePath, 'utf-8');

  const parser = stream.pipe(
    parse({
      columns: (headerRow: string[]) => {
        headers = headerRow.map((h) => h.trim());
        headersResolved = true;
        return headers;
      },
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    }),
  );

  async function* generateRows(): AsyncGenerator<RawRow> {
    for await (const record of parser) {
      yield record as RawRow;
    }
  }

  // Wait for headers to be resolved by reading the first record
  await new Promise<void>((resolve, reject) => {
    parser.once('readable', () => {
      parser.read(); // Trigger header parsing
      resolve();
    });
    parser.once('error', reject);
  });

  return { rows: generateRows(), headers };
}

export function validateHeaders(headers: string[]): string[] {
  const missing: string[] = [];

  for (const col of EXPECTED_COLUMNS) {
    if (!headers.includes(col)) {
      missing.push(col);
    }
  }

  return missing;
}
