import { writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  ImportOptions,
  ImportSummary,
  ImportStats,
  RowError,
  NormalizedFragrance,
  NormalizedBrand,
  NormalizedPerfumer,
  NormalizedNote,
  NormalizedAccord,
} from './types';
import { parseCsv, validateHeaders } from './parser';
import { validateRows } from './validator';
import { normalizeRows } from './normalizer';

const LOG_DIR = join(process.cwd(), 'logs');
const ERROR_LOG_PATH = join(LOG_DIR, 'import-errors.csv');

function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

function writeErrorLog(errors: RowError[]): void {
  ensureLogDir();

  if (!existsSync(ERROR_LOG_PATH)) {
    const header = 'row_number,field,reason,raw_row\n';
    writeFileSync(ERROR_LOG_PATH, header, 'utf-8');
  }

  for (const err of errors) {
    const escaped = JSON.stringify(err.rawRow).replace(/"/g, '""');
    const line = `${err.rowNumber},"${err.field}","${err.reason}","${escaped}"\n`;
    appendFileSync(ERROR_LOG_PATH, line, 'utf-8');
  }
}

function collectUniqueBrands(fragrances: NormalizedFragrance[]): NormalizedBrand[] {
  const seen = new Set<string>();
  const brands: NormalizedBrand[] = [];
  for (const f of fragrances) {
    if (!seen.has(f.brand.slug)) {
      seen.add(f.brand.slug);
      brands.push(f.brand);
    }
  }
  return brands;
}

function collectUniquePerfumers(fragrances: NormalizedFragrance[]): NormalizedPerfumer[] {
  const seen = new Set<string>();
  const perfumers: NormalizedPerfumer[] = [];
  for (const f of fragrances) {
    for (const p of f.perfumers) {
      if (!seen.has(p.slug)) {
        seen.add(p.slug);
        perfumers.push(p);
      }
    }
  }
  return perfumers;
}

function collectUniqueNotes(fragrances: NormalizedFragrance[]): NormalizedNote[] {
  const seen = new Set<string>();
  const notes: NormalizedNote[] = [];
  for (const f of fragrances) {
    for (const n of f.notes) {
      if (!seen.has(n.slug)) {
        seen.add(n.slug);
        notes.push({ name: n.name, slug: n.slug });
      }
    }
  }
  return notes;
}

function collectUniqueAccords(fragrances: NormalizedFragrance[]): NormalizedAccord[] {
  const seen = new Set<string>();
  const accords: NormalizedAccord[] = [];
  for (const f of fragrances) {
    for (const a of f.accords) {
      if (!seen.has(a.slug)) {
        seen.add(a.slug);
        accords.push({ name: a.name, slug: a.slug });
      }
    }
  }
  return accords;
}

async function preloadBrands(
  supabase: ImportOptions['supabase'],
): Promise<Map<string, string>> {
  const client = supabase as any;
  const nameToId = new Map<string, string>();

  const { data } = await client.from('brands').select('slug, id');
  if (data) {
    for (const row of data) {
      nameToId.set(row.slug, row.id);
    }
  }
  return nameToId;
}

async function upsertBrands(
  supabase: ImportOptions['supabase'],
  brands: NormalizedBrand[],
  stats: ImportStats,
  nameToId: Map<string, string>,
): Promise<void> {
  const client = supabase as any;

  for (const brand of brands) {
    if (nameToId.has(brand.slug)) {
      stats.brandsReused++;
      continue;
    }

    const { data: inserted } = await client
      .from('brands')
      .insert({ slug: brand.slug, name: brand.name })
      .select('id')
      .single();

    if (inserted) {
      nameToId.set(brand.slug, inserted.id);
      stats.brandsCreated++;
    }
  }
}

async function preloadPerfumers(
  supabase: ImportOptions['supabase'],
): Promise<Map<string, string>> {
  const client = supabase as any;
  const slugToId = new Map<string, string>();

  const { data } = await client.from('perfumers').select('slug, id');
  if (data) {
    for (const row of data) {
      slugToId.set(row.slug, row.id);
    }
  }
  return slugToId;
}

async function upsertPerfumers(
  supabase: ImportOptions['supabase'],
  perfumers: NormalizedPerfumer[],
  stats: ImportStats,
  slugToId: Map<string, string>,
): Promise<void> {
  const client = supabase as any;

  for (const perfumer of perfumers) {
    if (slugToId.has(perfumer.slug)) {
      stats.perfumersReused++;
      continue;
    }

    const { data: inserted } = await client
      .from('perfumers')
      .insert({ slug: perfumer.slug, name: perfumer.name })
      .select('id')
      .single();

    if (inserted) {
      slugToId.set(perfumer.slug, inserted.id);
      stats.perfumersCreated++;
    }
  }
}

async function preloadNotes(
  supabase: ImportOptions['supabase'],
): Promise<Map<string, string>> {
  const client = supabase as any;
  const slugToId = new Map<string, string>();

  const { data } = await client.from('notes').select('slug, id');
  if (data) {
    for (const row of data) {
      slugToId.set(row.slug, row.id);
    }
  }
  return slugToId;
}

async function upsertNotes(
  supabase: ImportOptions['supabase'],
  notes: NormalizedNote[],
  stats: ImportStats,
  slugToId: Map<string, string>,
): Promise<void> {
  const client = supabase as any;

  for (const note of notes) {
    if (slugToId.has(note.slug)) {
      stats.notesReused++;
      continue;
    }

    const { data: inserted } = await client
      .from('notes')
      .insert({ slug: note.slug, name: note.name })
      .select('id')
      .single();

    if (inserted) {
      slugToId.set(note.slug, inserted.id);
      stats.notesCreated++;
    }
  }
}

async function preloadAccords(
  supabase: ImportOptions['supabase'],
): Promise<Map<string, string>> {
  const client = supabase as any;
  const slugToId = new Map<string, string>();

  const { data } = await client.from('accords').select('slug, id');
  if (data) {
    for (const row of data) {
      slugToId.set(row.slug, row.id);
    }
  }
  return slugToId;
}

async function preloadFragrances(
  supabase: ImportOptions['supabase'],
): Promise<Map<string, string>> {
  const client = supabase as any;
  const compositeToImportHash = new Map<string, string>();

  const { data } = await client
    .from('fragrances')
    .select('brand_id, name, type, import_hash');

  if (data) {
    for (const row of data) {
      const key = `${row.brand_id}:${row.name}:${row.type ?? ''}`;
      compositeToImportHash.set(key, row.import_hash);
    }
  }
  return compositeToImportHash;
}

async function upsertAccords(
  supabase: ImportOptions['supabase'],
  accords: NormalizedAccord[],
  stats: ImportStats,
  slugToId: Map<string, string>,
): Promise<void> {
  const client = supabase as any;

  for (const accord of accords) {
    if (slugToId.has(accord.slug)) {
      stats.accordsReused++;
      continue;
    }

    const { data: inserted } = await client
      .from('accords')
      .insert({ slug: accord.slug, name: accord.name })
      .select('id')
      .single();

    if (inserted) {
      slugToId.set(accord.slug, inserted.id);
      stats.accordsCreated++;
    }
  }
}

async function upsertFragrances(
  supabase: ImportOptions['supabase'],
  fragrances: NormalizedFragrance[],
  brandIds: Map<string, string>,
  stats: ImportStats,
  fragranceCompositeMap: Map<string, string>,
): Promise<Map<string, string>> {
  const client = supabase as any;
  const hashToId = new Map<string, string>();

  // Build payloads for all fragrances
  const payloads = fragrances
    .map((f) => {
      const brandId = brandIds.get(f.brand.slug);
      if (!brandId) return null;

      return {
        brand_id: brandId,
        name: f.name,
        slug: f.slug,
        type: f.type,
        concentration: f.concentration,
        launch_year: f.launchYear,
        rating_average: f.ratingAverage,
        rating_count: f.ratingCount,
        source: 'parfumo' as const,
        external_id: f.externalId,
        external_url: f.externalUrl,
        import_hash: f.importHash,
        raw_data: f.rawData,
        updated_at: new Date().toISOString(),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (payloads.length === 0) return hashToId;

  // Deduplicate by import_hash (keep last occurrence)
  const uniquePayloads = Array.from(
    new Map(payloads.map(p => [p.import_hash, p])).values()
  );

  // Deduplicate slugs within batch to avoid unique constraint violation on idx_fragrances_slug
  const slugCounts = new Map<string, number>();
  for (const p of uniquePayloads) {
    const count = slugCounts.get(p.slug) ?? 0;
    if (count > 0) {
      p.slug = `${p.slug}-${count}`;
    }
    slugCounts.set(p.slug, count + 1);
  }

  // Deduplicate by composite key (brand_id, name, type) within batch
  // Keep first occurrence, skip subsequent ones with same composite key
  const seenCompositeKeys = new Set<string>();
  const deduplicatedPayloads = [];
  for (const p of uniquePayloads) {
    const key = `${p.brand_id}:${p.name}:${p.type ?? ''}`;
    if (!seenCompositeKeys.has(key)) {
      seenCompositeKeys.add(key);
      deduplicatedPayloads.push(p);
    }
  }

  // Use preloaded fragrance composite map to handle cross-batch conflicts
  // For payloads whose composite key exists in DB, use the existing import_hash so upsert becomes update
  for (const p of deduplicatedPayloads) {
    const key = `${p.brand_id}:${p.name}:${p.type ?? ''}`;
    const existingImportHash = fragranceCompositeMap.get(key);
    if (existingImportHash) {
      p.import_hash = existingImportHash;
    }
  }

  // Batch upsert keyed by import_hash (unique constraint idx_fragrances_import_hash)
  const { data, error } = await client
    .from('fragrances')
    .upsert(deduplicatedPayloads, { onConflict: 'import_hash', count: 'exact' })
    .select('id, import_hash');

  if (error) {
    throw error;
  }

  // Map returned IDs back to import_hash
  for (const row of data ?? []) {
    hashToId.set(row.import_hash, row.id);
  }

  // Determine inserted vs updated by checking which import_hashes existed before
  // We can't easily distinguish, so we'll do a pre-check for stats
  // For now, count all as updated (since most will be updates in subsequent runs)
  // A more accurate approach would require a pre-fetch of existing import_hashes
  stats.fragrancesUpdated += data?.length ?? 0;

  return hashToId;
}

async function upsertFragrancePerfumers(
  supabase: ImportOptions['supabase'],
  fragrances: NormalizedFragrance[],
  fragranceIds: Map<string, string>,
  perfumerIds: Map<string, string>,
  stats: ImportStats,
): Promise<void> {
  const client = supabase as any;
  const rows: { fragrance_id: string; perfumer_id: string }[] = [];

  for (const f of fragrances) {
    const fragranceId = fragranceIds.get(f.importHash);
    if (!fragranceId) continue;

    for (const p of f.perfumers) {
      const perfumerId = perfumerIds.get(p.slug);
      if (!perfumerId) continue;

      rows.push({ fragrance_id: fragranceId, perfumer_id: perfumerId });
    }
  }

  if (rows.length === 0) return;

  // Deduplicate by primary key
  const uniqueRows = Array.from(
    new Map(rows.map(r => [`${r.fragrance_id}:${r.perfumer_id}`, r])).values()
  );

  const { data, error } = await client
    .from('fragrance_perfumers')
    .upsert(uniqueRows, { onConflict: 'fragrance_id, perfumer_id', count: 'exact' })
    .select('fragrance_id');

  if (error) {
    throw error;
  }

  const inserted = data?.length ?? 0;
  stats.joinRowsInserted += inserted;
  stats.joinRowsSkipped += uniqueRows.length - inserted;
}

async function upsertFragranceNotes(
  supabase: ImportOptions['supabase'],
  fragrances: NormalizedFragrance[],
  fragranceIds: Map<string, string>,
  noteIds: Map<string, string>,
  stats: ImportStats,
): Promise<void> {
  const client = supabase as any;
  const rows: { fragrance_id: string; note_id: string; position: string }[] = [];

  for (const f of fragrances) {
    const fragranceId = fragranceIds.get(f.importHash);
    if (!fragranceId) continue;

    for (const n of f.notes) {
      const noteId = noteIds.get(n.slug);
      if (!noteId) continue;

      rows.push({ fragrance_id: fragranceId, note_id: noteId, position: n.position });
    }
  }

  if (rows.length === 0) return;

  // Deduplicate by primary key
  const uniqueRows = Array.from(
    new Map(rows.map(r => [`${r.fragrance_id}:${r.note_id}:${r.position}`, r])).values()
  );

  const { data, error } = await client
    .from('fragrance_notes')
    .upsert(uniqueRows, { onConflict: 'fragrance_id, note_id, position', count: 'exact' })
    .select('fragrance_id');

  if (error) {
    throw error;
  }

  const inserted = data?.length ?? 0;
  stats.joinRowsInserted += inserted;
  stats.joinRowsSkipped += uniqueRows.length - inserted;
}

async function upsertFragranceAccords(
  supabase: ImportOptions['supabase'],
  fragrances: NormalizedFragrance[],
  fragranceIds: Map<string, string>,
  accordIds: Map<string, string>,
  stats: ImportStats,
): Promise<void> {
  const client = supabase as any;
  const rows: { fragrance_id: string; accord_id: string }[] = [];

  for (const f of fragrances) {
    const fragranceId = fragranceIds.get(f.importHash);
    if (!fragranceId) continue;

    for (const a of f.accords) {
      const accordId = accordIds.get(a.slug);
      if (!accordId) continue;

      rows.push({ fragrance_id: fragranceId, accord_id: accordId });
    }
  }

  if (rows.length === 0) return;

  // Deduplicate by primary key
  const uniqueRows = Array.from(
    new Map(rows.map(r => [`${r.fragrance_id}:${r.accord_id}`, r])).values()
  );

  const { data, error } = await client
    .from('fragrance_accords')
    .upsert(uniqueRows, { onConflict: 'fragrance_id, accord_id', count: 'exact' })
    .select('fragrance_id');

  if (error) {
    throw error;
  }

  const inserted = data?.length ?? 0;
  stats.joinRowsInserted += inserted;
  stats.joinRowsSkipped += uniqueRows.length - inserted;
}

function printProgress(
  batchIndex: number,
  totalBatches: number,
  fragranceCount: number,
  elapsedMs: number,
  limit: number,
): void {
  const elapsed = (elapsedMs / 1000).toFixed(1);
  const pct = Math.min(100, Math.round((fragranceCount / limit) * 100));
  const remaining = fragranceCount > 0
    ? ((elapsedMs / fragranceCount) * (limit - fragranceCount) / 1000).toFixed(0)
    : '?';

  process.stdout.write(
    `\r[batch ${batchIndex}/${totalBatches}] ${fragranceCount}/${limit} fragrances (${pct}%) | ${elapsed}s elapsed | ~${remaining}s remaining`,
  );
}

function printDryRunSummary(
  fragrances: NormalizedFragrance[],
  errors: RowError[],
): void {
  const brands = collectUniqueBrands(fragrances);
  const perfumers = collectUniquePerfumers(fragrances);
  const notes = collectUniqueNotes(fragrances);
  const accords = collectUniqueAccords(fragrances);

  console.log('\n');
  console.log('┌─ Dry Run Summary ────────────────────────────');
  console.log(`│ Brands:     ${brands.length}`);
  console.log(`│ Fragrances: ${fragrances.length}`);
  console.log(`│ Notes:      ${notes.length}`);
  console.log(`│ Accords:    ${accords.length}`);
  console.log(`│ Perfumers:  ${perfumers.length}`);
  console.log(`│ Valid rows: ${fragrances.length}`);
  console.log(`│ Errors:     ${errors.length}`);
  console.log('└───────────────────────────────────────────────');
}

function printImportSummary(summary: ImportSummary): void {
  const s = summary.stats;
  const duration = (summary.durationMs / 1000).toFixed(1);

  console.log('\n');
  console.log('┌─ Import Summary ──────────────────────────────');
  console.log(`│ Status:           ${summary.status}`);
  console.log(`│ Duration:         ${duration}s`);
  console.log(`│ Rows processed:   ${summary.rowsProcessed}`);
  console.log(`│ Fragrances:       ${s.fragrancesInserted + s.fragrancesUpdated}`);
  console.log(`│   Inserted:       ${s.fragrancesInserted}`);
  console.log(`│   Updated:        ${s.fragrancesUpdated}`);
  console.log(`│ Brands:           ${s.brandsCreated + s.brandsReused}`);
  console.log(`│   Created:        ${s.brandsCreated}`);
  console.log(`│   Reused:         ${s.brandsReused}`);
  console.log(`│ Perfumers:        ${s.perfumersCreated + s.perfumersReused}`);
  console.log(`│   Created:        ${s.perfumersCreated}`);
  console.log(`│   Reused:         ${s.perfumersReused}`);
  console.log(`│ Notes:            ${s.notesCreated + s.notesReused}`);
  console.log(`│   Created:        ${s.notesCreated}`);
  console.log(`│   Reused:         ${s.notesReused}`);
  console.log(`│ Accords:          ${s.accordsCreated + s.accordsReused}`);
  console.log(`│   Created:        ${s.accordsCreated}`);
  console.log(`│   Reused:         ${s.accordsReused}`);
  console.log(`│ Join rows:        ${s.joinRowsInserted + s.joinRowsSkipped}`);
  console.log(`│   Inserted:       ${s.joinRowsInserted}`);
  console.log(`│   Skipped:        ${s.joinRowsSkipped}`);
  console.log(`│ Errors:           ${summary.rowsErrored}`);
  console.log('└───────────────────────────────────────────────');
}

export async function run(options: ImportOptions): Promise<ImportSummary> {
  const startTime = Date.now();
  const stats: ImportStats = {
    brandsCreated: 0,
    brandsReused: 0,
    perfumersCreated: 0,
    perfumersReused: 0,
    notesCreated: 0,
    notesReused: 0,
    accordsCreated: 0,
    accordsReused: 0,
    fragrancesInserted: 0,
    fragrancesUpdated: 0,
    joinRowsInserted: 0,
    joinRowsSkipped: 0,
  };

  const allErrors: RowError[] = [];
  let rowsProcessed = 0;
  let rowsValid = 0;
  let fragranceCount = 0;
  let batchIndex = 0;

  // ── Parse ──────────────────────────────────────────────
  console.log('Parsing CSV...');
  const { rows, headers } = await parseCsv(options.filePath);
  console.log('CSV parsing complete');

  // Validate headers
  const missingHeaders = validateHeaders(headers);
  if (missingHeaders.length > 0) {
    return {
      status: 'aborted',
      durationMs: Date.now() - startTime,
      rowsProcessed: 0,
      rowsValid: 0,
      rowsErrored: 0,
      errors: [{
        rowNumber: 0,
        field: 'header',
        reason: `Missing required columns: ${missingHeaders.join(', ')}`,
        rawRow: {},
      }],
      limit: options.limit,
      stats,
    };
  }

  // ── Preload dimension tables (once per import) ──────────
  console.log('Preloading dimension tables...');
  const brandIds = await preloadBrands(options.supabase);
  const perfumerIds = await preloadPerfumers(options.supabase);
  const noteIds = await preloadNotes(options.supabase);
  const accordIds = await preloadAccords(options.supabase);
  const fragranceCompositeMap = await preloadFragrances(options.supabase);
  console.log('Dimension tables preloaded');

  // ── Process in batches ─────────────────────────────────
  let batchBuffer: import('./types').RawRow[] = [];

  for await (const rawRow of rows) {
    // Check limit before processing this row
    if (options.limit > 0 && rowsProcessed >= options.limit) {
      break;
    }
    rowsProcessed++;
    batchBuffer.push(rawRow);

    if (batchBuffer.length >= options.batchSize) {
      const result = await processBatch(
        batchBuffer,
        options,
        stats,
        allErrors,
        batchIndex,
        fragranceCount,
        startTime,
        brandIds,
        perfumerIds,
        noteIds,
        accordIds,
        fragranceCompositeMap,
      );
      rowsValid += result.validCount;
      fragranceCount = result.fragranceCount;
      batchIndex++;
      batchBuffer = [];

      if (options.limit > 0 && fragranceCount >= options.limit) break;
    }
  }

  // Process remaining rows
  if (batchBuffer.length > 0 && (options.limit === 0 || fragranceCount < options.limit)) {
    const result = await processBatch(
      batchBuffer,
      options,
      stats,
      allErrors,
      batchIndex,
      fragranceCount,
      startTime,
      brandIds,
      perfumerIds,
      noteIds,
      accordIds,
      fragranceCompositeMap,
    );
    rowsValid += result.validCount;
  }

  process.stdout.write('\n');

  // ── Write error log ────────────────────────────────────
  if (allErrors.length > 0) {
    writeErrorLog(allErrors);
    console.log(`\nWrote ${allErrors.length} errors to ${ERROR_LOG_PATH}`);
  }

  const durationMs = Date.now() - startTime;

  return {
    status: 'completed',
    durationMs,
    rowsProcessed,
    rowsValid,
    rowsErrored: allErrors.length,
    errors: allErrors,
    limit: options.limit,
    stats,
  };
}

async function processBatch(
  batchBuffer: import('./types').RawRow[],
  options: ImportOptions,
  stats: ImportStats,
  allErrors: RowError[],
  batchIndex: number,
  currentFragranceCount: number,
  startTime: number,
  brandIds: Map<string, string>,
  perfumerIds: Map<string, string>,
  noteIds: Map<string, string>,
  accordIds: Map<string, string>,
  fragranceCompositeMap: Map<string, string>,
): Promise<{ fragranceCount: number; validCount: number }> {
  // ── Validate ───────────────────────────────────────────
  console.log('Validation complete');
  const { valid, errors } = validateRows(batchBuffer);
  allErrors.push(...errors);

  if (valid.length === 0) return { fragranceCount: currentFragranceCount, validCount: 0 };

  // Check error threshold
  const errorRate = errors.length / batchBuffer.length;
  if (errorRate > 0.05) {
    throw new Error(
      `Aborting: ${(errorRate * 100).toFixed(1)}% of rows have validation errors (threshold: 5%)`,
    );
  }

  // ── Normalize ──────────────────────────────────────────
  console.log('Normalization complete');
  const normalized = normalizeRows(valid);

  // ── Dry run ────────────────────────────────────────────
  if (options.dryRun) {
    printDryRunSummary(normalized, allErrors);
    return { fragranceCount: currentFragranceCount + normalized.length, validCount: normalized.length };
  }

  // ── Upsert in dependency order ─────────────────────────
  console.log('Connecting to Supabase');
  console.log('Upserting brands');
  await upsertBrands(options.supabase, collectUniqueBrands(normalized), stats, brandIds);
  console.log('Upserting perfumers');
  await upsertPerfumers(options.supabase, collectUniquePerfumers(normalized), stats, perfumerIds);
  console.log('Upserting notes');
  await upsertNotes(options.supabase, collectUniqueNotes(normalized), stats, noteIds);
  console.log('Upserting accords');
  await upsertAccords(options.supabase, collectUniqueAccords(normalized), stats, accordIds);
  console.log('Upserting fragrances');
  const fragranceIds = await upsertFragrances(options.supabase, normalized, brandIds, stats, fragranceCompositeMap);

  console.log('Upserting join tables');
  await upsertFragrancePerfumers(options.supabase, normalized, fragranceIds, perfumerIds, stats);
  await upsertFragranceNotes(options.supabase, normalized, fragranceIds, noteIds, stats);
  await upsertFragranceAccords(options.supabase, normalized, fragranceIds, accordIds, stats);

  const newCount = currentFragranceCount + normalized.length;
  const totalBatches = Math.ceil(options.limit / options.batchSize);
  printProgress(batchIndex + 1, totalBatches, newCount, Date.now() - startTime, options.limit);

  return { fragranceCount: newCount, validCount: normalized.length };
}
