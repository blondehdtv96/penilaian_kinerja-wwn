# Requirements Document

## Introduction

The Integrated Misconduct System connects every disciplinary artifact in the performance
application into a single escalating flow: recording a violation (pelanggaran), following up
with counseling (konseling), issuing a yellow card (kartu kuning), and issuing a warning letter
(surat peringatan level 1-3).

Today these records exist but are only partially linked: counseling references a misconduct,
while kartu kuning and surat peringatan are standalone and disconnected from violation points.
Point values are also entered manually per misconduct, with no shared catalog.

This feature introduces (1) a configurable catalog of violation types, each carrying a defined
point value ("variable nilai" per pelanggaran), (2) per-operator point accumulation that drives
escalation, (3) explicit linkage of counseling, kartu kuning, and surat peringatan back to the
triggering violation(s), and (4) consistent, predictable effects on the operator performance
score and misconduct counter across all stages.

## Glossary

- **Disciplinary_System**: The backend service responsible for recording and integrating all misconduct-related records (misconduct, counseling, kartu kuning, surat peringatan).
- **Violation_Catalog**: The managed collection of violation types, each with a name, category, severity, and point value.
- **Violation_Type**: A single catalog entry describing a category of violation and its associated point value.
- **Catalog_Points**: The point value defined for a Violation_Type in the Violation_Catalog.
- **Misconduct_Record**: A recorded violation committed by an operator, referencing a Violation_Type.
- **Counseling_Record**: A counseling/coaching session that follows up on a Misconduct_Record.
- **Kartu_Kuning**: A yellow card issued to an operator as a disciplinary escalation step.
- **Surat_Peringatan**: A warning letter issued to an operator at level 1, 2, or 3.
- **Escalation_Engine**: The component that evaluates accumulated points against configured thresholds and determines the required next disciplinary step.
- **Accumulated_Points**: The running total of active misconduct points attributed to an operator.
- **Escalation_Threshold**: A configured Accumulated_Points value at which a specific disciplinary step (counseling, kartu kuning, or a surat peringatan level) becomes required.
- **Performance_Score**: The numeric operator score (`Operator.performanceScore`) reduced by misconduct points.
- **Misconduct_Counter**: The operator counter (`Operator.totalMisconduct`) tracking the number of recorded violations.
- **Foreman**: A user role authorized to record misconduct, create counseling, and issue disciplinary documents.
- **Section_Manager**: A user role authorized to manage the catalog, record misconduct, issue disciplinary documents, and acknowledge counseling.
- **Operator**: The employee subject to disciplinary records.

## Requirements

### Requirement 1: Manage Violation Catalog

**User Story:** As a Section Manager, I want to define violation types with configurable point values, so that every recorded violation uses a consistent, agreed-upon penalty.

#### Acceptance Criteria

1. WHEN a Section_Manager submits a new Violation_Type with a name of 1 to 100 characters, a non-empty category, a non-empty severity, and an integer point value from 1 to 100 inclusive, THE Disciplinary_System SHALL store the Violation_Type in the Violation_Catalog.
2. IF a submitted Violation_Type has a name that already exists in the Violation_Catalog when compared case-insensitively and ignoring leading and trailing whitespace, THEN THE Disciplinary_System SHALL reject the submission, retain the existing Violation_Catalog unchanged, and return an error indicating a duplicate name.
3. IF a submitted Violation_Type has a name that is empty, contains only whitespace, or exceeds 100 characters, THEN THE Disciplinary_System SHALL reject the submission, retain the existing Violation_Catalog unchanged, and return an error indicating the specific invalid field.
4. IF a submitted or updated Violation_Type has a point value that is non-integer, less than 1, or greater than 100, THEN THE Disciplinary_System SHALL reject the request, retain the affected Violation_Type unchanged, and return an error indicating an invalid point value.
5. WHEN a Section_Manager updates the point value of an existing Violation_Type to a valid integer from 1 to 100 inclusive, THE Disciplinary_System SHALL apply the updated Catalog_Points to Misconduct_Records created after the update while leaving Catalog_Points on existing Misconduct_Records unchanged.
6. WHEN a Foreman or Section_Manager requests the catalog, THE Disciplinary_System SHALL return the list of Violation_Types in the Violation_Catalog within 3 seconds.
7. WHEN a Section_Manager deactivates a Violation_Type, THE Disciplinary_System SHALL exclude the deactivated Violation_Type from the default catalog selection list while retaining existing Misconduct_Records that reference it.

### Requirement 2: Record Misconduct Using Catalog Points

**User Story:** As a Foreman, I want to record a violation by selecting a violation type, so that its point value is applied automatically without manual entry.

#### Acceptance Criteria

1. WHEN a Foreman or Section_Manager records a Misconduct_Record referencing an existing Violation_Type for an operator, THE Disciplinary_System SHALL assign the current Catalog_Points of that Violation_Type to the Misconduct_Record.
2. IF a Misconduct_Record is submitted referencing a Violation_Type that does not exist in the Violation_Catalog, THEN THE Disciplinary_System SHALL reject the submission and return a validation error.
3. IF a Misconduct_Record is submitted for an operator that does not exist in the Disciplinary_System, THEN THE Disciplinary_System SHALL reject the submission, create no Misconduct_Record, and return a not-found error indicating the operator does not exist.
4. IF a Misconduct_Record is submitted by a role other than Foreman or Section_Manager, THEN THE Disciplinary_System SHALL reject the submission, create no Misconduct_Record, and return an authorization error.
5. WHEN a Misconduct_Record is submitted referencing an inactive Violation_Type that exists in the Violation_Catalog, THE Disciplinary_System SHALL create the Misconduct_Record using the inactive Violation_Type Catalog_Points.
6. WHEN a Misconduct_Record is created, THE Disciplinary_System SHALL increment the operator Misconduct_Counter by 1.
7. WHEN a Misconduct_Record is created, THE Disciplinary_System SHALL decrease the operator Performance_Score by the assigned Catalog_Points of the Misconduct_Record, and SHALL set the Performance_Score to 0 if the resulting value would be below 0.
8. WHEN a Misconduct_Record is created, THE Disciplinary_System SHALL increase the operator Accumulated_Points by the assigned Catalog_Points of the Misconduct_Record.
9. WHEN a Misconduct_Record is created, THE Disciplinary_System SHALL deliver a notification of the recorded violation to the affected operator and the Section_Manager role within 5 seconds.

### Requirement 3: Integrate Counseling With Misconduct

**User Story:** As a Foreman, I want counseling sessions to reference the violation that triggered them, so that follow-up actions are traceable to their cause.

#### Acceptance Criteria

1. IF a Counseling_Record is submitted without referencing an existing Misconduct_Record, THEN THE Disciplinary_System SHALL reject the submission, create no Counseling_Record, and return an error indicating a prior Misconduct_Record is required.
2. IF a Counseling_Record is submitted for a Misconduct_Record that already has a Counseling_Record, THEN THE Disciplinary_System SHALL reject the submission, create no additional Counseling_Record, and return a duplicate-counseling error indicating the Misconduct_Record already has a Counseling_Record.
3. WHEN a Counseling_Record is created, THE Disciplinary_System SHALL associate the Counseling_Record with the operator of the referenced Misconduct_Record.
4. WHEN a Section_Manager acknowledges a Counseling_Record that has not yet been acknowledged, THE Disciplinary_System SHALL record the acknowledging user identity and the acknowledgment timestamp on the Counseling_Record.
5. IF a Section_Manager acknowledges a Counseling_Record that has already been acknowledged, THEN THE Disciplinary_System SHALL reject the acknowledgment, retain the existing acknowledging user identity and acknowledgment timestamp unchanged, and return an already-acknowledged error.
6. WHEN a Counseling_Record is created, THE Disciplinary_System SHALL notify the affected operator of the counseling session within 5 seconds of creation.

### Requirement 4: Evaluate Escalation From Accumulated Points

**User Story:** As a Section Manager, I want the system to determine the required disciplinary step based on accumulated points, so that escalation is consistent and driven by defined thresholds.

#### Acceptance Criteria

1. THE Disciplinary_System SHALL maintain a set of Escalation_Thresholds that map Accumulated_Points values to required disciplinary steps in the ordered sequence counseling, kartu kuning, surat peringatan level 1, surat peringatan level 2, surat peringatan level 3, where each Escalation_Threshold is an integer of at least 1 and thresholds are strictly increasing across the ordered steps.
2. WHEN an operator Accumulated_Points value changes, THE Escalation_Engine SHALL, within 5 seconds, determine the highest disciplinary step whose Escalation_Threshold is met, where "met" means the operator Accumulated_Points is greater than or equal to that step's Escalation_Threshold.
3. IF an operator Accumulated_Points value is below the lowest Escalation_Threshold, THEN THE Escalation_Engine SHALL determine that no disciplinary step is required and THE Disciplinary_System SHALL send no step-due notification for that operator.
4. WHEN the Escalation_Engine determines that a disciplinary step is required and that step is higher than the current escalation level, where the current escalation level is the highest disciplinary step already issued to the operator, THE Disciplinary_System SHALL notify the Foreman and Section_Manager roles within 5 seconds that the step is due for the operator.
5. IF the Escalation_Engine determines that the required disciplinary step is equal to or lower than the current escalation level, where the current escalation level is the highest disciplinary step already issued to the operator, THEN THE Disciplinary_System SHALL suppress a duplicate step-due notification for that operator.
6. WHERE a Section_Manager has configured Escalation_Threshold values, THE Disciplinary_System SHALL use the configured values instead of the default values when evaluating escalation.
7. IF a submitted Escalation_Threshold configuration contains a value that is not an integer or is less than 1, OR defines a higher disciplinary step with an Escalation_Threshold that is not strictly greater than that of a lower disciplinary step, THEN THE Disciplinary_System SHALL reject the configuration, return a validation error indicating the invalid or non-increasing threshold, and retain the previously active Escalation_Threshold values unchanged.

### Requirement 5: Issue Kartu Kuning Linked to Misconduct

**User Story:** As a Foreman, I want a yellow card to be linked to the accumulated violations that triggered it, so that the escalation is auditable.

#### Acceptance Criteria

1. WHEN a Foreman or Section_Manager issues a Kartu_Kuning for an existing operator, THE Disciplinary_System SHALL associate the Kartu_Kuning with the operator Accumulated_Points value at issuance, with the contributing Misconduct_Records (defined as the operator's active Misconduct_Records whose assigned Catalog_Points sum equals the operator Accumulated_Points at issuance), and SHALL record the issuing user identity and the issuance timestamp.
2. IF a Kartu_Kuning is issued for an operator whose Accumulated_Points is below the kartu kuning Escalation_Threshold, THEN THE Disciplinary_System SHALL record the issuance and flag it as a manual override with the issuing user identity.
3. IF a Kartu_Kuning issuance is requested for an operator identifier that does not correspond to an existing operator, THEN THE Disciplinary_System SHALL reject the issuance, create no Kartu_Kuning record, and return an error indication that the operator does not exist.
4. IF a non-override Kartu_Kuning issuance is requested for an operator that already has an active Kartu_Kuning at the operator's current escalation level, THEN THE Disciplinary_System SHALL reject the issuance, create no additional Kartu_Kuning record, and return an error indication that a Kartu_Kuning already exists at the current escalation level.
5. WHEN a Kartu_Kuning is issued, THE Disciplinary_System SHALL notify the affected operator and the Section_Manager role.
6. WHEN a Foreman or Section_Manager requests the Kartu_Kuning records for a specified operator, THE Disciplinary_System SHALL return the list of that operator's Kartu_Kuning records, and SHALL return an empty list when the operator has no Kartu_Kuning records.
7. WHEN an operator requests their own Kartu_Kuning records, THE Disciplinary_System SHALL return only the Kartu_Kuning records belonging to that requesting operator.

### Requirement 6: Issue Surat Peringatan Linked to Escalation

**User Story:** As a Section Manager, I want warning letters to reflect the escalation level driven by accumulated points, so that letter levels are issued in the correct order.

#### Acceptance Criteria

1. WHEN a Foreman or Section_Manager issues a Surat_Peringatan for an operator, THE Disciplinary_System SHALL associate the Surat_Peringatan with the operator Accumulated_Points value at the moment of issuance and with every active Misconduct_Record that contributes to that Accumulated_Points value at issuance.
2. IF a Surat_Peringatan of level N is submitted for an operator who has not been issued every Surat_Peringatan level from 1 through N minus 1, WHERE N is greater than 1, THEN THE Disciplinary_System SHALL reject the submission, return a sequencing error, and retain the operator existing Surat_Peringatan records unchanged.
3. IF a Surat_Peringatan is submitted with a level that is not the integer 1, 2, or 3, THEN THE Disciplinary_System SHALL reject the submission, return a validation error, and retain the operator existing Surat_Peringatan records unchanged.
4. WHEN a Surat_Peringatan is issued, THE Disciplinary_System SHALL, within 5 seconds of issuance, notify the affected operator and the Section_Manager role of the issued Surat_Peringatan level.
5. WHEN a Foreman or Section_Manager requests the list of Surat_Peringatan records for a specified operator, THE Disciplinary_System SHALL return those records ordered by ascending level, and SHALL return an empty list when the specified operator has no Surat_Peringatan records.
6. IF a Surat_Peringatan of level N is issued for an operator whose Accumulated_Points is below the Escalation_Threshold configured for Surat_Peringatan level N, THEN THE Disciplinary_System SHALL record the issuance and flag it as a manual override with the issuing user identity.
7. IF a Surat_Peringatan is submitted at a level that has already been issued to the operator, THEN THE Disciplinary_System SHALL reject the submission, return a duplicate-level error, and retain the operator existing Surat_Peringatan records unchanged.

### Requirement 7: Provide Integrated Disciplinary View

**User Story:** As a Section Manager, I want to see an operator's full disciplinary chain in one place, so that I can understand the progression from violation to warning letter.

#### Acceptance Criteria

1. WHEN a Foreman or Section_Manager requests the disciplinary history for an operator, THE Disciplinary_System SHALL return the operator's Misconduct_Records, Counseling_Records, Kartu_Kuning records, and Surat_Peringatan records, each ordered chronologically from oldest to newest by creation timestamp.
2. WHEN a Foreman or Section_Manager requests the disciplinary history for an operator, THE Disciplinary_System SHALL include, for each Counseling_Record, a reference to its associated Misconduct_Record, and, for each Kartu_Kuning record and Surat_Peringatan record, references to the Misconduct_Records that contributed to it.
3. THE Disciplinary_System SHALL include the operator's current Accumulated_Points and the current escalation step determined by the Escalation_Engine in the disciplinary history response.
4. WHEN an operator requests their own disciplinary history, THE Disciplinary_System SHALL return only the records belonging to that operator, ordered chronologically from oldest to newest by creation timestamp.
5. IF a disciplinary history is requested for an operator identifier that does not exist, THEN THE Disciplinary_System SHALL reject the request and return an error indicating the operator was not found, without returning any disciplinary records.
6. IF an operator requests the disciplinary history of a different operator, THEN THE Disciplinary_System SHALL reject the request and return an authorization error, without returning any disciplinary records.

### Requirement 8: Maintain Score and Counter Consistency

**User Story:** As a Section Manager, I want operator scores and counters to stay consistent with recorded violations, so that reported figures are trustworthy.

#### Acceptance Criteria

1. WHEN the set of Misconduct_Records for an operator changes and the change operation completes successfully, THE Disciplinary_System SHALL set the operator Accumulated_Points equal to the sum of the Catalog_Points assigned to that operator's active Misconduct_Records.
2. WHEN the set of Misconduct_Records for an operator changes and the change operation completes successfully, THE Disciplinary_System SHALL set the operator Misconduct_Counter equal to the total count of that operator's Misconduct_Records.
3. WHEN a Misconduct_Record is created, THE Disciplinary_System SHALL apply the Misconduct_Record creation and the updates to the operator Performance_Score, Accumulated_Points, and Misconduct_Counter as a single atomic operation.
4. IF any step of creating a Misconduct_Record or of updating the operator Performance_Score, Accumulated_Points, or Misconduct_Counter fails, THEN THE Disciplinary_System SHALL roll back all of those changes as a single unit so that the Misconduct_Record is not persisted and the Performance_Score, Accumulated_Points, and Misconduct_Counter equal their values immediately before the operation, and SHALL return an error indicating the operation failed.
