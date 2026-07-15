import { createHash } from 'node:crypto';
import type { ValidRow, NormalizedFragrance } from './types';

const CONCENTRATION_MAP: Record<string, string> = {
  'eau de toilette': 'EDT',
  'edt': 'EDT',
  'eau de parfum': 'EDP',
  'edp': 'EDP',
  'parfum': 'Parfum',
  'extrait de parfum': 'Parfum',
  'extrait': 'Parfum',
  'eau fraiche': 'Eau Fraiche',
  'cologne': 'Cologne',
  'eau de cologne': 'Eau de Cologne',
  'aftershave': 'Aftershave',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFloatSafe(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isNaN(parsed) ? null : parsed;
}

function parseIntSafe(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function splitAndTrim(value: string | undefined): string[] {
  if (!value || value.trim() === '') return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function normalizeConcentration(value: string | undefined): string | null {
  if (!value || value.trim() === '') return null;
  const lower = value.toLowerCase().trim();
  return CONCENTRATION_MAP[lower] ?? null;
}

function generateImportHash(externalId: string): string {
  return createHash('sha256')
    .update(`parfumo:${externalId}`)
    .digest('hex');
}

export function normalizeRows(validRows: ValidRow[]): NormalizedFragrance[] {
  return validRows.map((row) => {
    const d = row.data;
    const brandName = d['Brand'].trim();
    const fragranceName = d['Name'].trim();
    const externalId = d['Number'].trim();

    const brandSlug = slugify(brandName);
    const fragranceSlug = slugify(`${brandName} ${fragranceName}`);

    const notesTop = splitAndTrim(d['Top_Notes']);
    const notesHeart = splitAndTrim(d['Middle_Notes']);
    const notesBase = splitAndTrim(d['Base_Notes']);
    const accordsList = splitAndTrim(d['Main_Accords']);
    const perfumersList = splitAndTrim(d['Perfumers']);

    return {
      brand: { name: brandName, slug: brandSlug },
      name: fragranceName,
      slug: fragranceSlug,
      type: null,
      concentration: normalizeConcentration(d['Concentration']),
      launchYear: parseIntSafe(d['Release_Year']),
      ratingAverage: parseFloatSafe(d['Rating_Value']),
      ratingCount: parseIntSafe(d['Rating_Count']),
      externalId,
      externalUrl: d['URL']?.trim() || null,
      importHash: generateImportHash(externalId),
      rawData: d,
      notes: [
        ...notesTop.map((n) => ({ name: n, slug: slugify(n), position: 'top' as const })),
        ...notesHeart.map((n) => ({ name: n, slug: slugify(n), position: 'heart' as const })),
        ...notesBase.map((n) => ({ name: n, slug: slugify(n), position: 'base' as const })),
      ],
      accords: accordsList.map((a) => ({ name: a, slug: slugify(a), intensity: null })),
      perfumers: perfumersList.map((p) => ({ name: p, slug: slugify(p) })),
    };
  });
}
