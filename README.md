# RANCANG BANGUN SISTEM MERIT-MISCONDUCT BERBASIS BLOCKCHAIN

## Studi Kasus: PT Bridgestone Tire Indonesia Bekasi Plant

Sistem penilaian kinerja operator manufaktur berbasis real-time event dengan integritas data blockchain (on-chain).

## 🚀 Teknologi

### Backend
- Next.js 15 + Express.js
- TypeScript
- Prisma ORM + SQLite
- Socket.IO (Real-time)
- JWT Authentication
- SHA-256 Blockchain

### Frontend
- Vue.js 3
- Ionic Vue
- Pinia (State Management)
- TailwindCSS
- Socket.IO Client
- QR Code Scanner

## � Struktur Proyek

```
penilaian_kinerja/
├── backend/              # Backend API (Next.js + Express)
│   ├── prisma/          # Database schema
│   ├── src/
│   │   ├── auth/        # Authentication
│   │   ├── users/       # User management
│   │   ├── roles/       # Role management
│   │   ├── permissions/ # Permission management
│   │   ├── operators/   # Operator management
│   │   ├── merit/       # Merit events
│   │   ├── misconduct/  # Misconduct events
│   │   ├── blockchain/  # Blockchain service
│   │   ├── dashboard/   # Dashboard KPI
│   │   ├── reports/     # Reporting
│   │   ├── socket/      # Socket.IO handlers
│   │   └── middleware/  # Auth & RBAC middleware
│   └── package.json
│
└── frontend/            # Frontend App (Vue.js + Ionic)
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── pages/       # Page components
    │   ├── router/      # Vue Router
    │   ├── services/    # API services
    │   ├── stores/      # Pinia stores
    │   └── ionic/       # Ionic components
    └── package.json
```

## 🔑 Fitur Utama

### 1. Authentication & Authorization
- JWT-based authentication
- Role-Based Access Control (RBAC)
- 5 Level akses: Super Admin, HRD, Manager, Supervisor, Operator

### 2. Merit-Misconduct Management
- Real-time event tracking
- Approval workflow
- Point system
- QR Code employee scanning

### 3. Blockchain Audit Trail
- SHA-256 hash chain
- Tamper-proof logging
- Chain integrity verification
- Genesis block initialization

### 4. Performance Dashboard
- KPI monitoring
- Real-time ranking
- Performance charts
- Department analytics

### 5. Reporting System
- Operator performance report
- Merit & misconduct report
- Department report
- Blockchain audit report

## �️ Instalasi

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run database migration
npm run prisma:migrate

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔐 Role & Permissions

### Super Admin
✅ Kelola seluruh sistem
✅ User & role management
✅ Blockchain monitoring
✅ System configuration

### HRD
✅ Monitoring kinerja
✅ Approve/reject events
✅ Export laporan
✅ Employee management

### Manager
✅ Dashboard KPI
✅ Performance analytics
✅ Blockchain audit
✅ Department reports

### Supervisor
✅ Scan QR operator
✅ Input merit/misconduct
✅ View team performance
✅ Real-time notifications

### Operator
✅ View personal score
✅ View ranking
✅ QR identity
✅ Notification center

## 📊 Database Schema

**Core Tables:**
- users, roles, permissions
- role_permissions, user_roles
- operators, divisions, departments
- shifts, production_lines
- merit_events, misconduct_events
- performance_logs, blockchain_logs
- notifications, audit_logs

## 🔗 API Endpoints

Base URL: `http://localhost:3001/api`

### Authentication
- POST `/auth/login`
- POST `/auth/register`
- GET `/auth/me`
- POST `/auth/refresh`

### Operators
- GET `/operators`
- GET `/operators/ranking`
- POST `/operators`
- GET `/operators/:id`

### Merit & Misconduct
- POST `/merit`
- PUT `/merit/:id/approve`
- GET `/misconduct`
- PUT `/misconduct/:id/approve`

### Blockchain
- GET `/blockchain`
- GET `/blockchain/verify`
- GET `/blockchain/:blockIndex`

### Dashboard & Reports
- GET `/dashboard/kpi`
- GET `/dashboard/performance-chart`
- GET `/reports/operator-performance`
- GET `/reports/blockchain-audit`

## 🌐 Socket.IO Events

### Server → Client
- `merit:created`
- `merit:approved`
- `misconduct:created`
- `misconduct:approved`

### Client → Server
- `join:operator`
- `join:supervisor`
- `join:hrd`
- `join:manager`

## � Mobile Support

Frontend menggunakan Ionic Vue untuk mendukung:
- Progressive Web App (PWA)
- iOS native app
- Android native app
- Responsive design

## 🔒 Security Features

- JWT token authentication
- Password hashing (bcrypt)
- RBAC authorization
- SQL injection prevention (Prisma)
- XSS protection
- CORS configuration
- Audit logging
- Blockchain tamper detection

## 📝 Development

```bash
# Backend
npm run dev          # Development mode
npm run build        # Production build
npm run prisma:studio # Database GUI

# Frontend
npm run dev          # Development mode
npm run build        # Production build
npm run preview      # Preview build
```

## 🧪 Testing

```bash
# Backend testing
npm run test

# Frontend testing
npm run test:unit
npm run test:e2e
```

## 📄 License

MIT License - PT Bridgestone Tire Indonesia

## 👥 Developer

System developed for PT Bridgestone Tire Indonesia - Bekasi Plant
