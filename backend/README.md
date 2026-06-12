# Merit-Misconduct Backend API

Backend API untuk Sistem Merit-Misconduct berbasis Blockchain untuk PT Bridgestone Tire Indonesia.

## Tech Stack

- **Framework**: Next.js 15 + Express.js
- **Language**: TypeScript
- **Database**: SQLite dengan Prisma ORM
- **Real-Time**: Socket.IO
- **Authentication**: JWT
- **Security**: RBAC (Role-Based Access Control)
- **Blockchain**: SHA-256 Hash Chain

## Instalasi

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run dev
```

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Users (Super Admin, HRD)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/toggle-status` - Toggle user status
- `DELETE /api/users/:id` - Delete user

### Roles (Super Admin)
- `GET /api/roles` - Get all roles
- `GET /api/roles/:id` - Get role by ID
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

### Permissions (Super Admin)
- `GET /api/permissions` - Get all permissions
- `GET /api/permissions/grouped` - Get permissions by module
- `GET /api/permissions/:id` - Get permission by ID
- `POST /api/permissions` - Create permission
- `PUT /api/permissions/:id` - Update permission
- `DELETE /api/permissions/:id` - Delete permission

### Operators
- `POST /api/operators` - Create operator (Super Admin, HRD)
- `GET /api/operators` - Get all operators
- `GET /api/operators/ranking` - Get operator ranking
- `GET /api/operators/:id` - Get operator by ID
- `GET /api/operators/employee/:employeeId` - Get by employee ID
- `PUT /api/operators/:id` - Update operator
- `DELETE /api/operators/:id` - Delete operator

### Merit Events
- `POST /api/merit` - Create merit (Supervisor, HRD, Manager)
- `PUT /api/merit/:id/approve` - Approve merit (HRD, Manager)
- `PUT /api/merit/:id/reject` - Reject merit (HRD, Manager)
- `GET /api/merit/operator/:operatorId` - Get by operator
- `GET /api/merit` - Get all merits

### Misconduct Events
- `POST /api/misconduct` - Create misconduct
- `PUT /api/misconduct/:id/approve` - Approve misconduct
- `PUT /api/misconduct/:id/reject` - Reject misconduct
- `GET /api/misconduct/operator/:operatorId` - Get by operator
- `GET /api/misconduct` - Get all misconducts

### Blockchain
- `GET /api/blockchain` - Get blockchain
- `GET /api/blockchain/verify` - Verify blockchain integrity
- `GET /api/blockchain/:blockIndex` - Get specific block
- `POST /api/blockchain/genesis` - Initialize genesis block

### Dashboard
- `GET /api/dashboard/kpi` - Get KPI dashboard
- `GET /api/dashboard/performance-chart` - Get performance chart

### Reports
- `GET /api/reports/operator-performance` - Operator performance report
- `GET /api/reports/merit-misconduct` - Merit & misconduct report
- `GET /api/reports/department` - Department report
- `GET /api/reports/blockchain-audit` - Blockchain audit report

## Role-Based Access Control

### Super Admin
- Manage users, roles, permissions
- Full system access
- Blockchain monitoring

### HRD
- Monitor performance
- Approve/reject events
- Export reports

### Manager
- Dashboard KPI
- Audit blockchain
- View reports

### Supervisor
- Scan QR operator
- Input merit/misconduct

### Operator
- View personal scores
- View ranking
- QR identity

## Database Schema

Tables:
- users
- roles
- permissions
- role_permissions
- user_roles
- operators
- divisions
- departments
- shifts
- production_lines
- merit_events
- misconduct_events
- performance_logs
- blockchain_logs
- notifications
- audit_logs

## Socket.IO Events

### Emit Events
- `merit:created` - When merit is created
- `merit:approved` - When merit is approved
- `misconduct:created` - When misconduct is created
- `misconduct:approved` - When misconduct is approved

### Join Rooms
- `join:operator` - Operator room
- `join:supervisor` - Supervisor room
- `join:hrd` - HRD room
- `join:manager` - Manager room

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio
npm run prisma:studio
```

## License

MIT License - PT Bridgestone Tire Indonesia
