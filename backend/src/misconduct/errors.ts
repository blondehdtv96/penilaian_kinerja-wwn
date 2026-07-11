/**
 * Typed error classes for the integrated misconduct system and a shared mapper
 * that translates each class to its HTTP status code.
 *
 * The service layer throws these typed errors; controllers use `toHttpError`
 * (or `errorStatus`) to map them to the correct HTTP status instead of the
 * previous blanket 500 responses.
 *
 * Status mapping (see design.md "Error Handling"):
 *   ValidationError    -> 400
 *   DuplicateError     -> 409
 *   SequenceError      -> 409
 *   NotFoundError      -> 404
 *   AuthorizationError -> 403
 *   ConflictError      -> 409
 */

/**
 * Base class for all domain errors raised by the misconduct system.
 * Carries a stable `name` so it can be discriminated after crossing async
 * boundaries where `instanceof` may be unreliable (e.g. transpilation).
 */
export abstract class DomainError extends Error {
  /** Discriminating tag matching the concrete class name. */
  abstract readonly name: string;

  constructor(message: string) {
    super(message);
    // Restore prototype chain for reliable `instanceof` under transpilation.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Invalid input: bad name/points/level, or non-increasing thresholds.
 * Maps to HTTP 400. Carries an optional `field` discriminator so the API can
 * indicate the specific invalid field (R1.3, R1.4, R4.7, R6.3).
 */
export class ValidationError extends DomainError {
  readonly name = 'ValidationError';
  /** The specific input field that failed validation, when applicable. */
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

/**
 * A record that must be unique already exists: duplicate catalog name,
 * duplicate counseling, duplicate surat peringatan level, or a duplicate
 * kartu kuning at the current level. Maps to HTTP 409.
 * (R1.2, R3.2, R5.4, R6.7)
 */
export class DuplicateError extends DomainError {
  readonly name = 'DuplicateError';
}

/**
 * A surat peringatan level was submitted out of the required sequence.
 * Maps to HTTP 409. (R6.2)
 */
export class SequenceError extends DomainError {
  readonly name = 'SequenceError';
}

/**
 * A referenced entity does not exist: missing operator, violation type, or
 * misconduct. Maps to HTTP 404. (R2.2, R2.3, R3.1, R5.3, R7.5)
 */
export class NotFoundError extends DomainError {
  readonly name = 'NotFoundError';
}

/**
 * The requester's role is not permitted, or an operator is accessing another
 * operator's data. Maps to HTTP 403. (R2.4, R7.6)
 */
export class AuthorizationError extends DomainError {
  readonly name = 'AuthorizationError';
}

/**
 * A conflicting state transition: re-acknowledging an already-acknowledged
 * counseling. Maps to HTTP 409. (R3.5)
 */
export class ConflictError extends DomainError {
  readonly name = 'ConflictError';
}

/** The set of concrete domain error class names used for discrimination. */
export type DomainErrorName =
  | 'ValidationError'
  | 'DuplicateError'
  | 'SequenceError'
  | 'NotFoundError'
  | 'AuthorizationError'
  | 'ConflictError';

/**
 * Shared mapping from each domain error class name to its HTTP status code.
 */
const STATUS_BY_ERROR_NAME: Record<DomainErrorName, number> = {
  ValidationError: 400,
  DuplicateError: 409,
  SequenceError: 409,
  NotFoundError: 404,
  AuthorizationError: 403,
  ConflictError: 409,
};

/** Default status for unknown/unexpected errors. */
export const DEFAULT_ERROR_STATUS = 500;

/**
 * Type guard: is the value one of the typed domain errors?
 */
export function isDomainError(error: unknown): error is DomainError {
  if (error instanceof DomainError) return true;
  // Fall back to name-based discrimination for errors that lost their
  // prototype chain (e.g. across module/transpilation boundaries).
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: unknown }).name != null &&
    Object.prototype.hasOwnProperty.call(
      STATUS_BY_ERROR_NAME,
      (error as { name: string }).name,
    )
  );
}

/**
 * Map any error to its HTTP status code. Domain errors map per the table
 * above; all other errors map to 500.
 */
export function errorStatus(error: unknown): number {
  if (isDomainError(error)) {
    return STATUS_BY_ERROR_NAME[error.name as DomainErrorName];
  }
  return DEFAULT_ERROR_STATUS;
}

/** Shape of a normalized HTTP error response body. */
export interface HttpErrorResponse {
  status: number;
  body: {
    success: false;
    message: string;
    /** Present only for ValidationError with a field discriminator. */
    field?: string;
  };
}

/**
 * Translate any error into a normalized `{ status, body }` pair that a
 * controller can send directly, e.g. `res.status(status).json(body)`.
 */
export function toHttpError(error: unknown): HttpErrorResponse {
  const status = errorStatus(error);
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Internal server error';

  const body: HttpErrorResponse['body'] = { success: false, message };

  if (error instanceof ValidationError && error.field !== undefined) {
    body.field = error.field;
  }

  return { status, body };
}
