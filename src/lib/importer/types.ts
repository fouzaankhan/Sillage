import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

export interface ImportOptions {
  filePath: string;
  supabase: SupabaseClient<Database>;
  limit: number;
  batchSize: number;
  dryRun: boolean;
}

export interface RawRow {
  [column: string]: string | undefined;
}

export interface RowError {
  rowNumber: number;
  field: string;
  reason: string;
  rawRow: RawRow;
}

export interface ValidRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface NormalizedBrand {
  name: string;
  slug: string;
}

export interface NormalizedPerfumer {
  name: string;
  slug: string;
}

export interface NormalizedNote {
  name: string;
  slug: string;
}

export interface NormalizedAccord {
  name: string;
  slug: string;
}

export interface NormalizedFragrance {
  brand: NormalizedBrand;
  name: string;
  slug: string;
  type: string | null;
  concentration: string | null;
  launchYear: number | null;
  ratingAverage: number | null;
  ratingCount: number | null;
  externalId: string;
  externalUrl: string | null;
  importHash: string;
  rawData: Record<string, string>;
  notes: { name: string; slug: string; position: 'top' | 'heart' | 'base' }[];
  accords: { name: string; slug: string; intensity: string | null }[];
  perfumers: NormalizedPerfumer[];
}

export interface ImportStats {
  brandsCreated: number;
  brandsReused: number;
  perfumersCreated: number;
  perfumersReused: number;
  notesCreated: number;
  notesReused: number;
  accordsCreated: number;
  accordsReused: number;
  fragrancesInserted: number;
  fragrancesUpdated: number;
  joinRowsInserted: number;
  joinRowsSkipped: number;
}

export interface ImportSummary {
  status: 'completed' | 'aborted' | 'dry_run';
  durationMs: number;
  rowsProcessed: number;
  rowsValid: number;
  rowsErrored: number;
  errors: RowError[];
  limit: number;
  stats: ImportStats;
}