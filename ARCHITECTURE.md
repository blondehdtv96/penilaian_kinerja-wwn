# VoO / Ide Kaizen - Performance Management System v2.0

## System Overview
Platform manajemen kinerja operator dengan fitur VoO/Ide Kaizen, monitoring misconduct, konseling, kartu kuning, surat peringatan, dan blockchain hash anchoring.

## Tech Stack
- **Backend**: Express.js + TypeScript + Prisma ORM + SQLite
- **Frontend**: Next.js 14 App Router + Tailwind CSS + Zustand
- **Blockchain**: Ethereum Ganache + Ethers.js (hash anchoring)
- **Database**: SQLite (dev) / PostgreSQL (production)

## Roles (3 Roles)
| Role | Description |
|------|-------------|
| Operator | Scan QR area, submit VoO/Ide Kaizen, upload foto, lihat status, riwayat merit |
| Foreman | Approval VoO, input misconduct/konseling/kartu kuning/SP, monitoring operator |
| Section Manager | Approval final, dashboard KPI, ranking, trend analysis, export PDF/Excel |

## Credentials (Seed Data)
| Role | Username | Password |
|------|----------|----------|
| Section Manager | section_manager | manager123 |
| Foreman | foreman01 | foreman123 |
| Foreman | foreman02 | foreman123 |
| Operator 1-5 | operator01-05 | operator123 |

## Quick Start
```bash
# Backend
cd backend
npm install
npx prisma db push --force-reset
npx tsx prisma/seed.ts
npx tsx src/index.ts

# Frontend (separate terminal)
cd frontend-next
npm install
npm run dev
```

## API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | - | Login |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/operators | SM, FM | List operators |
| GET | /api/operators/ranking | SM, FM | Operator ranking |
| GET | /api/operators/my-profile | OP | My operator profile |
| POST | /api/operators/scan-qr | All | Scan QR code |
| GET | /api/voo | All | List VoO submissions |
| POST | /api/voo | OP, FM | Create VoO submission |
| GET | /api/voo/my | OP | My submissions |
| POST | /api/voo/:id/approve-foreman | FM | Foreman approval |
| POST | /api/voo/:id/approve-manager | SM | Final approval |
| POST | /api/records/misconduct | FM, SM | Create misconduct |
| GET | /api/records/misconduct | All | List misconducts |
| POST | /api/records/counseling | FM | Create counseling |
| GET | /api/records/counseling | All | List counselings |
| POST | /api/records/kartu-kuning | FM, SM | Issue Kartu Kuning |
| POST | /api/records/surat-peringatan | FM, SM | Issue Surat Peringatan |
| GET | /api/dashboard/kpi | SM | KPI Dashboard |
| GET | /api/dashboard/export/pdf | SM | Export PDF |
| GET | /api/dashboard/export/excel | SM | Export Excel |
| GET | /api/qr-locations | SM, FM | QR area locations |
| GET | /api/blockchain/status | All | Blockchain status |
| GET | /api/blockchain/hashes | SM, FM | Hash records |
| GET | /api/audit-logs | SM | Audit trail |

## ERD Diagram
```mermaid
erDiagram
    ROLE ||--o{ USER : has
    USER ||--o| OPERATOR : has
    USER ||--o{ VOO_SUBMISSION : submits
    USER ||--o{ MISCONDUCT : creates
    USER ||--o{ COUNSELING : gives
    USER ||--o{ KARTU_KUNING : issues
    USER ||--o{ SURAT_PERINGATAN : issues
    USER ||--o{ APPROVAL : approves
    USER ||--o{ EVENT_LOG : logs
    USER ||--o{ BLOCKCHAIN_HASH : stores
    USER ||--o{ QR_SCAN_LOG : scans

    OPERATOR ||--o{ VOO_SUBMISSION : owns
    OPERATOR ||--o{ MISCONDUCT : receives
    OPERATOR ||--o{ COUNSELING : receives
    OPERATOR ||--o{ KARTU_KUNING : receives
    OPERATOR ||--o{ SURAT_PERINGATAN : receives

    QR_LOCATION ||--o{ QR_SCAN_LOG : scanned_at
    VOO_SUBMISSION ||--o{ APPROVAL : has
    VOO_SUBMISSION ||--o{ BLOCKCHAIN_HASH : anchored

    ROLE {
        int id
        string name
        string description
        json permissions
    }

    USER {
        int id
        string username
        string email
        string password
        string fullName
        string nip
        boolean isActive
        int roleId
    }

    OPERATOR {
        int id
        int userId
        string employeeId
        string section
        string line
        string group
        string position
        float performanceScore
        int totalMerit
        int totalMisconduct
    }

    QR_LOCATION {
        int id
        string name
        string code
        string area
        string qrImage
    }

    VOO_SUBMISSION {
        int id
        int operatorId
        int submittedById
        string title
        string description
        string type
        string status
        int points
    }

    MISCONDUCT {
        int id
        int operatorId
        int createdById
        string type
        string severity
        int points
    }

    COUNSELING {
        int id
        int operatorId
        int foremanId
        string topic
        string notes
    }

    KARTU_KUNING {
        int id
        int operatorId
        int issuedById
        string reason
    }

    SURAT_PERINGATAN {
        int id
        int operatorId
        int issuedById
        int level
        string reason
    }

    APPROVAL {
        int id
        string entityType
        int entityId
        int approverId
        string action
    }

    EVENT_LOG {
        int id
        int userId
        string action
        string module
        string details
    }

    BLOCKCHAIN_HASH {
        int id
        string entityType
        int entityId
        string txHash
        int blockNumber
        string data
    }
```

## Use Case Diagram
```mermaid
graph TB
    Operator --> Login
    Operator --> ScanQR
    Operator --> SubmitVoO
    Operator --> ViewStatus
    Operator --> ViewPerformance

    Foreman --> Login
    Foreman --> ApproveVoO
    Foreman --> InputMisconduct
    Foreman --> InputCounseling
    Foreman --> IssueKartuKuning
    Foreman --> IssueSuratPeringatan
    Foreman --> MonitorOperators

    SectionManager --> Login
    SectionManager --> FinalApproval
    SectionManager --> DashboardKPI
    SectionManager --> ViewRanking
    SectionManager --> TrendAnalysis
    SectionManager --> ExportReport
    SectionManager --> ViewBlockchain
    SectionManager --> ViewAuditLogs
```

## Activity Diagram - VoO Approval Workflow
```mermaid
graph TD
    A[Operator submits VoO] --> B[Status: pending]
    B --> C{Foreman reviews}
    C -->|Approve| D[Status: approved_foreman]
    C -->|Reject| E[Status: rejected]
    D --> F{Section Manager reviews}
    F -->|Approve| G[Status: approved_final + Points awarded]
    F -->|Reject| E
    G --> H[Blockchain hash stored]
    H --> I[Operator performance updated]
```

## Class Diagram
```mermaid
classDiagram
    class Role {
        +int id
        +string name
        +json permissions
    }

    class User {
        +int id
        +string username
        +string role
        +login()
        +hasPermission()
    }

    class Operator {
        +int id
        +string employeeId
        +string section
        +float performanceScore
        +submitVoO()
        +scanQR()
    }

    class VooSubmission {
        +int id
        +string title
        +string type
        +string status
        +int points
        +approveForeman()
        +approveManager()
    }

    class BlockchainService {
        +hashData()
        +storeHash()
        +verifyHash()
    }

    class AuditMiddleware {
        +auditLog()
        +getAuditLogs()
    }

    User --> Role
    Operator --> User
    VooSubmission --> Operator
    VooSubmission --> BlockchainService
    VooSubmission --> AuditMiddleware
```
