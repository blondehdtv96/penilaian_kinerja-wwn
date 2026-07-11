import { PrismaClient, ViolationType } from '@prisma/client';
import { ValidationError, DuplicateError, NotFoundError } from './errors';

const prisma = new PrismaClient();

/**
 * Input shape for creating a violation type (R1.1).
 * - `name`: 1..100 chars, non-whitespace-only, unique case-insensitively and
 *   ignoring leading/trailing whitespace.
 * - `category`: non-empty.
 * - `severity`: non-empty.
 * - `points`: integer in 1..100 inclusive.
 */
export interface ViolationTypeInput {
  name: string;
  category: string;
  severity: string;
  points: number;
}

const NAME_MIN = 1;
const NAME_MAX = 100;
const POINTS_MIN = 1;
const POINTS_MAX = 100;

/**
 * Normalize a name for duplicate detection: trim surrounding whitespace and
 * lower-case so that names differing only by case and/or surrounding
 * whitespace collide (R1.2).
 */
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Validate a name value. Rejects empty, whitespace-only, or over-length names
 * with a `field: 'name'` discriminator (R1.3).
 */
function validateName(name: unknown): string {
  if (typeof name !== 'string') {
    throw new ValidationError('Name is required and must be a string.', 'name');
  }
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN) {
    throw new ValidationError('Name must not be empty or whitespace-only.', 'name');
  }
  // Length is measured on the trimmed value: leading/trailing whitespace is
  // not significant for the 1..100 constraint.
  if (trimmed.length > NAME_MAX) {
    throw new ValidationError(`Name must be at most ${NAME_MAX} characters.`, 'name');
  }
  return trimmed;
}

/**
 * Validate a points value. Rejects non-integer or out-of-range values with a
 * `field: 'points'` discriminator (R1.4).
 */
function validatePoints(points: unknown): number {
  if (typeof points !== 'number' || !Number.isInteger(points)) {
    throw new ValidationError('Points must be an integer.', 'points');
  }
  if (points < POINTS_MIN || points > POINTS_MAX) {
    throw new ValidationError(
      `Points must be between ${POINTS_MIN} and ${POINTS_MAX} inclusive.`,
      'points',
    );
  }
  return points;
}

/**
 * Validate a required non-empty string field (category/severity) with the
 * given field discriminator (R1.1, R1.3).
 */
function validateNonEmpty(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} must not be empty.`, field);
  }
  return value.trim();
}

/**
 * Owns the `ViolationType` catalog lifecycle and validation.
 *
 * All mutations validate their inputs and throw typed errors from
 * `./errors.ts` (`ValidationError` with a `field` discriminator for invalid
 * name/points/category/severity, `DuplicateError` for duplicate normalized
 * names, `NotFoundError` for missing entries).
 */
export class CatalogService {
  /**
   * Create a new violation type (R1.1–R1.4).
   *
   * Validates name, category, severity, and points; rejects a duplicate
   * normalized name; and stores the entry so its `name`, `category`,
   * `severity`, and `points` equal the submitted (trimmed) values.
   */
  async createViolationType(input: ViolationTypeInput): Promise<ViolationType> {
    const name = validateName(input.name);
    const category = validateNonEmpty(input.category, 'category');
    const severity = validateNonEmpty(input.severity, 'severity');
    const points = validatePoints(input.points);
    const nameNormalized = normalizeName(name);

    const existing = await prisma.violationType.findUnique({ where: { nameNormalized } });
    if (existing) {
      throw new DuplicateError(`A violation type named "${name}" already exists.`);
    }

    return prisma.violationType.create({
      data: { name, nameNormalized, category, severity, points },
    });
  }

  /**
   * Update an existing violation type (R1.4, R1.5).
   *
   * Supports a partial patch and re-validates every supplied field. Updating
   * `points` changes only the catalog value used by *future* misconducts; it
   * never touches `Misconduct.points` on existing records (those are
   * snapshotted at creation time). Renaming re-checks the duplicate
   * constraint against the normalized name of other entries.
   */
  async updateViolationType(id: number, patch: Partial<ViolationTypeInput>): Promise<ViolationType> {
    const existing = await prisma.violationType.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Violation type ${id} does not exist.`);
    }

    const data: {
      name?: string;
      nameNormalized?: string;
      category?: string;
      severity?: string;
      points?: number;
    } = {};

    if (patch.name !== undefined) {
      const name = validateName(patch.name);
      const nameNormalized = normalizeName(name);
      if (nameNormalized !== existing.nameNormalized) {
        const clash = await prisma.violationType.findUnique({ where: { nameNormalized } });
        if (clash && clash.id !== id) {
          throw new DuplicateError(`A violation type named "${name}" already exists.`);
        }
      }
      data.name = name;
      data.nameNormalized = nameNormalized;
    }

    if (patch.category !== undefined) {
      data.category = validateNonEmpty(patch.category, 'category');
    }

    if (patch.severity !== undefined) {
      data.severity = validateNonEmpty(patch.severity, 'severity');
    }

    if (patch.points !== undefined) {
      data.points = validatePoints(patch.points);
    }

    return prisma.violationType.update({ where: { id }, data });
  }

  /**
   * Deactivate a violation type (R1.7).
   *
   * Sets `isActive = false` so the entry is excluded from the default catalog
   * listing while remaining in the database, so existing misconducts that
   * reference it still resolve.
   */
  async deactivateViolationType(id: number): Promise<ViolationType> {
    const existing = await prisma.violationType.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Violation type ${id} does not exist.`);
    }
    return prisma.violationType.update({ where: { id }, data: { isActive: false } });
  }

  /**
   * List catalog entries (R1.6, R1.7).
   *
   * Excludes `isActive = false` entries by default. Pass
   * `{ includeInactive: true }` to include deactivated entries (e.g. when
   * resolving references from historical misconducts).
   */
  async listCatalog(opts?: { includeInactive?: boolean }): Promise<ViolationType[]> {
    const where = opts?.includeInactive ? {} : { isActive: true };
    return prisma.violationType.findMany({ where, orderBy: { name: 'asc' } });
  }
}
