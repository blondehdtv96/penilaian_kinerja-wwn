# Product

## Register

product

## Users

**Factory supervisors** — primary mobile users. Standing on the production floor, scanning operator QR codes and recording merit or misconduct events in real time. Speed and tap-target clarity are critical. Context is loud, physical, and time-pressured.

**HRD and managers** — primary desktop users. Reviewing KPI dashboards, approving or rejecting events, generating reports, and monitoring blockchain audit trails. Trust in data integrity and information density matter most.

**Operators** — secondary mobile users. Checking their personal performance score, recent events, and rank. Low cognitive load; they come to see one number.

**System admins** — power users managing roles, permissions, and users. Infrequent but high-stakes; errors are costly.

Five roles: Super Admin, HRD, Manager, Supervisor, Operator. Each role sees a different surface of the same system.

## Product Purpose

A real-time merit–misconduct tracking system for manufacturing operators at PT Bridgestone Tire Indonesia (Bekasi Plant). Supervisors record positive (merit) and negative (misconduct) performance events against individual operators via QR code scan. All records are hashed into a SHA-256 blockchain to prevent tampering. Management uses the system to monitor KPIs, approve events, rank operators, and export reports.

Success means: every performance event is captured accurately, the audit trail is trusted, and management can act on data with confidence.

## Brand Personality

Authoritative, precise, trustworthy.

The interface commands confidence without being cold. It communicates that what is recorded here is permanent and matters. Bridgestone's red appears as an accent — in the primary toolbar, key actions, and status indicators — while the body stays neutral, data-forward, and uncluttered.

Not playful. Not generic. Not terminal-dark. Not lifeless.

## Anti-references

- **Generic blue admin** (Bootstrap, generic SaaS navy-and-white) — the current state; must be replaced.
- **Consumer-app playful** — bright gradient blobs, rounded pill everything, bubbly micro-interactions. This is an industrial tool.
- **Dark terminal aesthetic** — even with blockchain involved, avoid hacker-green on black. Trust comes from precision, not theatrics.
- **Cold corporate grey** — functional but joyless. The design should feel like it was built with care for the people using it.

## Design Principles

1. **Data integrity is visible.** The blockchain dimension should feel tangible — records look permanent, hashes look authoritative. The interface earns trust through its own precision.
2. **Role clarity, not role explanation.** Every surface is immediately legible for its specific user. A supervisor picking up the phone knows exactly what to tap. A manager opening the dashboard sees the KPI that matters first.
3. **Actions over decoration.** The primary flows — record event, approve, scan QR, view score — must be zero-friction. Ornamental UI is a cost measured in seconds on a factory floor.
4. **Industrial confidence.** Controlled color, precise type, minimal radius. The visual language communicates that this is a serious system built for serious work.
5. **Hierarchy earns trust.** Rankings, scores, and statuses must be unambiguous in visual weight. If two things look the same importance, the interface has failed.

## Accessibility & Inclusion

WCAG 2.1 AA minimum across all surfaces. Key considerations:
- Sufficient tap-target sizes (≥44×44px) for factory-floor mobile use with gloves or dirty hands.
- Color is never the sole indicator of status — merit/misconduct is always labeled, not just colored.
- All text meets 4.5:1 contrast ratio against its background.
