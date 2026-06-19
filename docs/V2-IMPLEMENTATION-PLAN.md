# VoO / Kaizen Performance Management V2.0 - Implementation Plan

## ✅ Status: Migrating to V2.0

Sistem lama (Merit-Misconduct Vue/Ionic) akan digantikan dengan V2.0 (VoO/Kaizen Next.js)

## 🎯 Super Admin Implementation Priority

### Phase 1: Core Authentication & RBAC ✓
- [x] JWT Authentication
- [x] Role-based access control
- [x] 3 Roles: Operator, Foreman, Section Manager
- [ ] **ADD: Super Admin Role** (NEW)

### Phase 2: Super Admin Features (PRIORITY)

#### 1. User Management
**Route:** `/superadmin/users`

**Features:**
- List all users (Operators, Foremen, Section Managers)
- Create new user
- Edit user details
- Assign/change roles
- Activate/deactivate users
- Reset password
- View user activity logs

**UI Components:**
- User table with filters (role, status, section)
- User form modal (create/edit)
- User detail view
- Bulk actions (activate, deactivate, export)

#### 2. Role & Permission Management
**Route:** `/superadmin/roles`

**Features:**
- View all roles
- Create custom roles
- Edit role permissions
- Delete custom roles (system roles protected)
- Permission matrix view
- Role assignment statistics

**Permissions Structure:**
```javascript
{
  "voo": ["view", "create", "approve_foreman", "approve_final", "reject"],
  "misconduct": ["view", "create", "edit", "delete"],
  "counseling": ["view", "create", "edit", "delete"],
  "kartu_kuning": ["view", "create", "edit", "delete"],
  "surat_peringatan": ["view", "create", "edit", "delete"],
  "operators": ["view", "create", "edit", "delete", "export"],
  "dashboard": ["view", "export"],
  "blockchain": ["view", "verify"],
  "audit_logs": ["view", "export"],
  "users": ["view", "create", "edit", "delete", "reset_password"],
  "roles": ["view", "create", "edit", "delete"],
  "qr_locations": ["view", "create", "edit", "delete"]
}
```

#### 3. System Settings
**Route:** `/superadmin/settings`

**Features:**
- Merit point configuration
- Misconduct severity points
- Performance scoring algorithm
- System notifications
- Backup & restore
- Database maintenance

#### 4. Audit Trail & Monitoring
**Route:** `/superadmin/audit`

**Features:**
- View all system events
- Filter by user, action, module, date
- Export audit logs
- System health monitoring
- User session tracking
- Security alerts

#### 5. QR Location Management
**Route:** `/superadmin/qr-locations`

**Features:**
- List all QR code locations
- Create new QR location
- Edit location details
- Generate QR code images
- Download QR codes (bulk)
- View scan statistics per location

## 🗂️ Database Schema Updates

### Add Super Admin Role
```prisma
// In seed.ts
const roles = [
  {
    name: "Super Admin",
    description: "System administrator with full access",
    permissions: {
      // ALL permissions
    }
  },
  {
    name: "Section Manager",
    description: "Manager with approval and reporting access",
    permissions: { /* ... */ }
  },
  {
    name: "Foreman",
    description: "Supervisor with input and approval access",
    permissions: { /* ... */ }
  },
  {
    name: "Operator",
    description: "Operator with submission and view access",
    permissions: { /* ... */ }
  }
];
```

### Super Admin User
```javascript
{
  username: "superadmin",
  password: "admin123",
  fullName: "Super Administrator",
  nip: "SA001",
  email: "superadmin@bridgestone.com",
  role: "Super Admin",
  isActive: true
}
```

## 📋 Implementation Checklist

### Backend Tasks
- [ ] Update Prisma schema for Super Admin role
- [ ] Create seed data for Super Admin user
- [ ] Add RBAC middleware for Super Admin routes
- [ ] Create `/api/superadmin/users` endpoints (CRUD)
- [ ] Create `/api/superadmin/roles` endpoints (CRUD)
- [ ] Create `/api/superadmin/settings` endpoints
- [ ] Create `/api/superadmin/qr-locations` endpoints
- [ ] Add audit log tracking for Super Admin actions
- [ ] Add password reset functionality
- [ ] Add bulk user operations

### Frontend Tasks
- [ ] Create Super Admin layout with sidebar
- [ ] Implement `/superadmin/users` page
- [ ] Implement `/superadmin/roles` page
- [ ] Implement `/superadmin/settings` page
- [ ] Implement `/superadmin/audit` page
- [ ] Implement `/superadmin/qr-locations` page
- [ ] Create user management components
- [ ] Create role management components
- [ ] Add permission matrix component
- [ ] Add QR code generator component
- [ ] Add audit log viewer component
- [ ] Add system health dashboard

### Testing Tasks
- [ ] Test Super Admin login
- [ ] Test user CRUD operations
- [ ] Test role CRUD operations
- [ ] Test permission assignment
- [ ] Test RBAC enforcement
- [ ] Test audit logging
- [ ] Test QR code generation
- [ ] Test bulk operations
- [ ] Test password reset flow
- [ ] Test session management

## 🚀 Getting Started

### 1. Update Database
```bash
cd backend
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

### 2. Login as Super Admin
```
Username: superadmin
Password: admin123
URL: http://localhost:3000/login
```

### 3. Access Super Admin Panel
```
http://localhost:3000/superadmin/users
http://localhost:3000/superadmin/roles
```

## 🗑️ Migration from Old System

### Delete Old System Files
```bash
# Backup first (optional)
mv frontend frontend-old-backup

# Or delete directly
rm -rf frontend/
```

### Update README.md
- Remove references to Vue.js/Ionic frontend
- Update to Next.js 14 documentation
- Update credentials section
- Update Quick Start guide

### Archive Old Documentation
```bash
mkdir docs/archive
mv OPERATOR_FEATURE_FIX.md docs/archive/
mv USERS-PAGE-DOCUMENTATION.md docs/archive/
mv LOGIN-FIX-COMPLETED.md docs/archive/
mv API-URL-FIX.md docs/archive/
```

## 📊 Super Admin Dashboard

### Metrics to Display
1. **System Overview**
   - Total users (by role)
   - Active sessions
   - Today's VoO submissions
   - Pending approvals

2. **User Activity**
   - Recent logins
   - Most active users
   - Failed login attempts
   - Account status changes

3. **System Health**
   - API response time
   - Database size
   - Error rate
   - Blockchain sync status

4. **Security Alerts**
   - Suspicious login attempts
   - Multiple failed logins
   - Unusual activity patterns
   - Permission changes

## 🔐 Security Considerations

### Super Admin Protection
1. **Strong Authentication**
   - Require strong password
   - 2FA (future enhancement)
   - Session timeout (30 minutes)
   - IP whitelist (optional)

2. **Audit Everything**
   - Log all Super Admin actions
   - Track permission changes
   - Monitor user modifications
   - Alert on critical changes

3. **Access Control**
   - Super Admin cannot be deleted
   - Cannot downgrade own role
   - Require confirmation for destructive actions
   - Implement role hierarchy

## 📖 API Documentation

### Super Admin Endpoints

#### Users Management
```
GET    /api/superadmin/users          - List all users
POST   /api/superadmin/users          - Create user
GET    /api/superadmin/users/:id      - Get user details
PUT    /api/superadmin/users/:id      - Update user
DELETE /api/superadmin/users/:id      - Delete user
POST   /api/superadmin/users/:id/reset-password - Reset password
PATCH  /api/superadmin/users/:id/toggle-status - Activate/deactivate
```

#### Roles Management
```
GET    /api/superadmin/roles          - List all roles
POST   /api/superadmin/roles          - Create role
GET    /api/superadmin/roles/:id      - Get role details
PUT    /api/superadmin/roles/:id      - Update role
DELETE /api/superadmin/roles/:id      - Delete role (custom only)
```

#### QR Locations
```
GET    /api/superadmin/qr-locations   - List all QR locations
POST   /api/superadmin/qr-locations   - Create QR location
GET    /api/superadmin/qr-locations/:id - Get location details
PUT    /api/superadmin/qr-locations/:id - Update location
DELETE /api/superadmin/qr-locations/:id - Delete location
GET    /api/superadmin/qr-locations/:id/qr-image - Download QR image
```

#### Settings
```
GET    /api/superadmin/settings       - Get all settings
PUT    /api/superadmin/settings       - Update settings
POST   /api/superadmin/backup         - Create database backup
POST   /api/superadmin/restore        - Restore from backup
```

#### Audit Logs
```
GET    /api/superadmin/audit-logs     - List audit logs (with filters)
GET    /api/superadmin/audit-logs/export - Export audit logs (CSV/Excel)
GET    /api/superadmin/audit-logs/stats - Get audit statistics
```

## 🎨 UI/UX Guidelines

### Design System
- Use Tailwind CSS utilities
- Follow Next.js 14 App Router patterns
- Implement responsive design (mobile-first)
- Use Shadcn UI components
- Dark mode support (optional)

### Color Scheme
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Amber (#F59E0B)
- Danger: Red (#EF4444)
- Super Admin: Purple (#8B5CF6)

### Icons
- Use Lucide React icons
- Consistent icon sizing
- Icon + text labels for clarity

## 📝 Documentation To Create

1. **SUPER-ADMIN-GUIDE.md** - User guide for Super Admins
2. **RBAC-DOCUMENTATION.md** - Role & Permission matrix
3. **API-REFERENCE-V2.md** - Complete API documentation
4. **DEPLOYMENT-GUIDE-V2.md** - Deployment instructions
5. **SECURITY-GUIDELINES.md** - Security best practices

## 🔄 Next Steps

1. ✅ Create this implementation plan
2. ⏳ Update Prisma schema with Super Admin role
3. ⏳ Create seed data for Super Admin
4. ⏳ Implement `/superadmin/users` page
5. ⏳ Implement `/superadmin/roles` page
6. ⏳ Test Super Admin functionality
7. ⏳ Delete old Vue.js frontend
8. ⏳ Update all documentation
9. ⏳ Deploy V2.0 system

---

**Version:** 2.0.0
**Last Updated:** June 12, 2026
**Status:** In Progress 🚧
