# Implementation Plan: Integrated Misconduct System

## Overview

This plan extends the existing `backend/src/misconduct/*` module into a point-driven disciplinary
escalation system. Work proceeds bottom-up: first the data model and the pure escalation engine
(no I/O, fully property-testable), then the catalog and transactional misconduct core, then the
counseling / kartu kuning / surat peringatan issuance flows, the integrated history view, and
finally the routes/controllers that wire everything together with role-based authorization and
error mapping. Each step builds on the previous one and ends integrated into the running module.

Implementation language: **TypeScript** (existing Express + Prisma + Socket.IO stack). Property
tests use **fast-check** with the project's test runner, minimum 100 iterations per property,
each tagged with its design property number.

## Tasks

- [x] 1. Data model and migration foundation
  - [x] 1.1 Extend the Prisma schema with catalog, accumulation, and linkage models
    - Add `ViolationType` model (`name`, `nameNormalized` unique, `category`, `severity`, `points`, `isActive`, timestamps)
    - Add `accumulatedPoints Int @default(0)` to `Operator`
    - Add `violationTypeId Int?` relation and `isActive Boolean @default(true)` to `Misconduct`
    - Add `accumulatedPointsAtIssuance`, `escalationLevelAtIssuance`, `isManualOverride` to `KartuKuning`
    - Add `accumulatedPointsAtIssuance`, `isManualOverride` to `SuratPeringatan`
    - Add `KartuKuningMisconduct` and `SuratPeringatanMisconduct` join tables with unique constraints
    - Add single-row `EscalationConfig` model (`counseling`, `kartuKuning`, `sp1`, `sp2`, `sp3`, `updatedById`, `updatedAt`)
    - Generate the additive migration (keep `violationTypeId` nullable so historical rows stay valid)
    - _Requirements: 1.1, 2.1, 4.6, 5.1, 6.1, 8.1_

  - [x] 1.2 Write a one-time accumulated-points backfill script
    - Add `backend/scripts/backfill-accumulated-points.ts` mirroring `scripts/resync-misconduct-count.ts`
    - Set `Operator.accumulatedPoints = sum(active misconduct points)` per operator
    - _Requirements: 8.1_

- [x] 2. Pure escalation engine
  - [x] 2.1 Implement the pure escalation logic in `escalation.ts`
    - Define `StepOrdinal`, `Thresholds`, and the fixed default threshold set (5/10/20/30/40)
    - Implement `requiredStep(points, thresholds)` returning the highest ordinal whose threshold ≤ points, else 0
    - Implement `shouldNotify(points, thresholds, currentLevel)` returning `requiredStep > currentLevel`
    - Implement `validateThresholds(raw)` enforcing integers ≥ 1 and strict monotonicity across steps
    - Keep this file free of Prisma and Socket.IO imports
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_

  - [x] 2.2 Write property test for threshold validation
    - **Property 13: Active thresholds are always valid and invalid configs are rejected**
    - **Validates: Requirements 4.1, 4.7**

  - [x] 2.3 Write property test for required-step evaluation
    - **Property 14: Required step is the highest step whose threshold is met**
    - **Validates: Requirements 4.2, 4.3, 4.6**

  - [x] 2.4 Write property test for step-due notification gating
    - **Property 15: Step-due notification fires exactly when the required step exceeds the current level**
    - **Validates: Requirements 4.4, 4.5**

- [x] 3. Escalation config service
  - [x] 3.1 Implement `escalation.config.ts` with `EscalationConfigService`
    - `getActiveThresholds()` returns the persisted override row or the defaults when absent
    - `setThresholds(input)` delegates to `validateThresholds`, persists on success, and leaves active values unchanged on validation failure
    - _Requirements: 4.6, 4.7_

  - [x] 3.2 Write unit tests for config load/override behavior
    - Test default fallback when no override exists and rejection paths preserving prior values
    - _Requirements: 4.6, 4.7_

- [x] 4. Violation catalog service
  - [x] 4.1 Implement `catalog.service.ts` with `CatalogService`
    - Implement `createViolationType`, `updateViolationType`, `deactivateViolationType`, `listCatalog`
    - Normalize names via `trim().toLowerCase()` into `nameNormalized` for duplicate detection
    - Validate name (1–100, non-whitespace-only) and points (integer 1–100) with a `field` discriminator on errors
    - `listCatalog()` excludes `isActive = false` by default; ensure references from misconducts still resolve
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7_

  - [x] 4.2 Write property test for faithful storage of valid violation types
    - **Property 1: Valid violation types are stored faithfully**
    - **Validates: Requirements 1.1**

  - [x] 4.3 Write property test for duplicate-name rejection
    - **Property 2: Duplicate names are rejected and leave the catalog unchanged**
    - **Validates: Requirements 1.2**

  - [x] 4.4 Write property test for invalid name/point rejection
    - **Property 3: Invalid name or point values are rejected without mutation**
    - **Validates: Requirements 1.3, 1.4**

  - [x] 4.5 Write property test for deactivation visibility and reference preservation
    - **Property 5: Deactivation hides from default listing but preserves references**
    - **Validates: Requirements 1.7**

- [x] 5. Error handling classes
  - [x] 5.1 Define typed error classes and controller status mapping
    - Add `ValidationError`, `DuplicateError`, `SequenceError`, `NotFoundError`, `AuthorizationError`, `ConflictError`
    - Add a shared mapper translating each class to its HTTP status (400/409/409/404/403/409)
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 3.1, 3.2, 3.5, 4.7, 5.3, 5.4, 6.2, 6.3, 6.7, 7.5, 7.6_

- [x] 6. Transactional misconduct core
  - [x] 6.1 Rewrite `createMisconduct` to be catalog-driven and transactional
    - Accept `violationTypeId` instead of manual points/type
    - Inside `prisma.$transaction`: load violation type (reject if missing, allow inactive), load operator (reject if missing), snapshot `points` and `violationTypeId` onto the misconduct
    - Recompute operator counters from ground truth: `accumulatedPoints = sum(active misconduct points)`, `totalMisconduct = count(misconducts)`, `performanceScore = max(0, performanceScore - points)`
    - After commit, fire operator + Section Manager notifications and emit `record:changed`
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9, 8.1, 8.2, 8.3, 8.4_

  - [x] 6.2 Invoke the escalation engine after successful misconduct creation
    - Compute `currentLevel` from the operator's highest issued step and call `shouldNotify`
    - Notify Foreman + Section Manager roles when a new step is due; suppress otherwise
    - _Requirements: 4.2, 4.4, 4.5_

  - [x] 6.3 Write property test for point snapshotting and non-retroactive catalog updates
    - **Property 4: Applied points are snapshotted and catalog updates are non-retroactive**
    - **Validates: Requirements 1.5, 2.1, 2.5**

  - [x] 6.4 Write property test for missing-reference rejection
    - **Property 6: Misconduct is rejected for a missing violation type or missing operator**
    - **Validates: Requirements 2.2, 2.3**

  - [x] 6.5 Write property test for performance-score decrease and zero floor
    - **Property 7: Performance score decreases by the applied points and floors at zero**
    - **Validates: Requirements 2.7**

  - [x] 6.6 Write property test for accumulated-points invariant
    - **Property 8: Accumulated points equal the sum of active misconduct points**
    - **Validates: Requirements 2.8, 8.1**

  - [x] 6.7 Write property test for misconduct-counter invariant
    - **Property 9: Misconduct counter equals the count of misconducts**
    - **Validates: Requirements 2.6, 8.2**

  - [x] 6.8 Write property test for transactional rollback
    - **Property 10: Misconduct creation is atomic and rolls back fully on failure**
    - **Validates: Requirements 8.3, 8.4**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Counseling integration
  - [x] 8.1 Enforce counseling linkage and one-to-one constraint in the service
    - Reject counseling without an existing misconduct; reject when the misconduct already has a counseling
    - Set the counseling operator from the referenced misconduct's operator; notify the operator on creation
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

  - [x] 8.2 Implement immutable acknowledgment in `acknowledgeCounseling`
    - Record acknowledging user identity and timestamp only when unacknowledged; reject re-acknowledgment with a conflict error
    - _Requirements: 3.4, 3.5_

  - [x] 8.3 Write property test for counseling linkage and one-to-one rule
    - **Property 11: Counseling requires a misconduct, is one-to-one, and inherits the operator**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 8.4 Write property test for acknowledgment immutability
    - **Property 12: Acknowledgment is recorded once and is immutable thereafter**
    - **Validates: Requirements 3.4, 3.5**

- [x] 9. Kartu kuning issuance
  - [x] 9.1 Rewrite `createKartuKuning` with snapshot, linkage, and guards
    - Reject unknown operators; snapshot `accumulatedPointsAtIssuance` and `escalationLevelAtIssuance`
    - Link the operator's active contributing misconducts via `KartuKuningMisconduct`; record issuing user + timestamp
    - Flag `isManualOverride` when accumulated points are below the kartu kuning threshold
    - Reject a non-override issuance when an active kartu kuning already exists at the current escalation level
    - Notify operator + Section Manager
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 9.2 Implement kartu kuning listing endpoints (all-by-operator and operator self-view)
    - Return the operator's records (empty list when none); self-view returns only the requester's records
    - _Requirements: 5.6, 5.7_

  - [x] 9.3 Write property test for issuance snapshot and contributing-misconduct linkage
    - **Property 16: Issuance snapshots accumulated points and links the contributing misconducts**
    - **Validates: Requirements 5.1, 6.1**

  - [x] 9.4 Write property test for below-threshold manual override
    - **Property 17: Below-threshold issuance is recorded as a manual override**
    - **Validates: Requirements 5.2, 6.6**

  - [x] 9.5 Write property test for unknown-operator and duplicate-level rejection
    - **Property 18: Issuance rejects unknown operators and non-override duplicates at the current level**
    - **Validates: Requirements 5.3, 5.4**

- [x] 10. Surat peringatan issuance
  - [x] 10.1 Rewrite `createSuratPeringatan` with sequencing, snapshot, and linkage
    - Validate `level` is exactly 1, 2, or 3; enforce strict sequencing (levels 1..N-1 must exist); reject duplicate levels
    - Snapshot `accumulatedPointsAtIssuance` and link active contributing misconducts; flag override when below threshold
    - Notify operator + Section Manager
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7_

  - [x] 10.2 Implement surat peringatan listing ordered by ascending level
    - Return records ordered by non-decreasing level; empty list when none
    - _Requirements: 6.5_

  - [x] 10.3 Write property test for legal, in-sequence, non-duplicate level acceptance
    - **Property 19: Surat peringatan is valid only with a legal, in-sequence, non-duplicate level**
    - **Validates: Requirements 6.2, 6.3, 6.7**

  - [x] 10.4 Write property test for ascending-level listing order
    - **Property 20: Surat peringatan listings are ordered by ascending level**
    - **Validates: Requirements 6.5**

  - [x] 10.5 Write property test for operator-scoped record listings
    - **Property 21: Record listings return only the requested operator's records**
    - **Validates: Requirements 5.6, 5.7, 7.4**

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Integrated disciplinary history
  - [x] 12.1 Implement `disciplinary-history.service.ts`
    - Assemble misconducts, counselings, kartu kuning, and surat peringatan ordered chronologically ascending
    - Include linkage references (counseling → misconduct; KK/SP → contributing misconducts)
    - Include current `accumulatedPoints` and `currentStep` from the escalation engine
    - Reject non-existent operators with a not-found error and return no records
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [x] 12.2 Write property test for chronological ordering of history collections
    - **Property 22: Disciplinary history collections are chronologically ordered**
    - **Validates: Requirements 7.1**

  - [x] 12.3 Write property test for history linkage references and escalation state
    - **Property 23: Disciplinary history includes linkage references and current escalation state**
    - **Validates: Requirements 7.2, 7.3**

  - [x] 12.4 Write property test for non-existent-operator rejection
    - **Property 24: Disciplinary history is rejected for a non-existent operator**
    - **Validates: Requirements 7.5**

- [x] 13. Routes, controllers, and authorization wiring
  - [x] 13.1 Add catalog and escalation-config controller handlers and routes
    - Wire `POST/PATCH /violation-types`, `PATCH /violation-types/:id/deactivate`, `GET /violation-types`
    - Wire `GET /escalation-config`, `PUT /escalation-config`
    - Apply `authMiddleware` + `checkRole` per the authorization matrix; use the error mapper for responses
    - _Requirements: 1.6, 4.6, 4.7_

  - [x] 13.2 Wire misconduct, counseling, kartu kuning, and surat peringatan handlers to the new services
    - Update controllers to call the transactional/issuance services and map typed errors to HTTP statuses
    - Enforce Foreman/Section Manager roles at the route layer so rejected roles never reach the services
    - _Requirements: 2.4, 3.4, 5.5, 6.4_

  - [x] 13.3 Add disciplinary history endpoints with role-based access
    - Wire `GET /disciplinary-history/:operatorId` (Foreman/Section Manager) and `GET /disciplinary-history/my` (Operator)
    - Reject an operator requesting another operator's history with an authorization error
    - _Requirements: 7.1, 7.4, 7.6_

  - [x] 13.4 Write integration tests for route authorization and notification dispatch
    - Assert 403 for disallowed roles (R2.4, R7.6) and mocked `notifyUser`/`notifyRole` calls on each creation/issuance
    - Assert catalog read returns the list for an authorized role (R1.6) and single step-due notification per crossed boundary (R4.5)
    - _Requirements: 1.6, 2.4, 2.9, 3.6, 4.5, 5.5, 6.4, 7.6_

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP.
- Each task references specific requirements (granular clauses) for traceability.
- Property tests use fast-check (min 100 iterations) and are tagged with their design property number.
- Properties 13–15 test the pure `escalation.ts` engine with no database; properties 4, 8, 9, 10, 16, 21 run against a disposable test database.
- Checkpoints ensure incremental validation as the module grows.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "5.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "2.3", "2.4", "3.1", "4.1"] },
    { "id": 2, "tasks": ["3.2", "4.2", "4.3", "4.4", "4.5", "6.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8"] },
    { "id": 4, "tasks": ["8.1", "8.2", "9.1", "10.1"] },
    { "id": 5, "tasks": ["8.3", "8.4", "9.2", "9.3", "9.4", "9.5", "10.2", "10.3", "10.4", "10.5"] },
    { "id": 6, "tasks": ["12.1"] },
    { "id": 7, "tasks": ["12.2", "12.3", "12.4", "13.1", "13.2", "13.3"] },
    { "id": 8, "tasks": ["13.4"] }
  ]
}
```
