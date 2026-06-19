# 🗺️ Super Admin Pages - Visual Guide

## Page Hierarchy

```
Super Admin Panel
├── 📊 Dashboard                    (/superadmin/dashboard)
│   ├── System Overview
│   ├── VoO Statistics
│   ├── Users by Role
│   └── Recent Activity
│
├── 👥 Users                        (/superadmin/users)
│   ├── User List
│   ├── Create User
│   ├── Edit User
│   ├── Delete User
│   ├── Toggle Status
│   └── Reset Password
│
├── 🛡️ Roles                        (/superadmin/roles)
│   ├── Role List
│   ├── Create Role
│   ├── Edit Role (Permissions)
│   └── Delete Role
│
├── 📍 QR Locations                 (/superadmin/qr-locations)
│   ├── Location Grid
│   ├── Create Location
│   ├── Edit Location
│   ├── View QR Code
│   ├── Download QR Code
│   └── Delete Location
│
└── 📋 Audit Logs                   (/superadmin/audit)
    ├── Log List
    ├── Filter Logs
    ├── Search Logs
    └── Export CSV
```

---

## 📊 Dashboard Page

### URL: `/superadmin/dashboard`

### Visual Layout:
```
┌─────────────────────────────────────────────────────────┐
│ [📊 Icon] System Dashboard              [🔄 Refresh]   │
│ Overview of system statistics and activity              │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ 👥 Total │ │ 🛡️ Roles │ │ 👷 Ops   │ │ 📍 QR    │   │
│ │ Users    │ │          │ │          │ │ Locations│   │
│ │   15     │ │    4     │ │    10    │ │    5     │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐     │
│ │ 📈 VoO / Ide Kaizen  │ │ ⚠️ Misconduct        │     │
│ │ ✅ Total: 50         │ │ ⚠️ Total: 10          │     │
│ │ ⏳ Pending: 5        │ │                       │     │
│ │ ✅ Approved: 45      │ │                       │     │
│ └──────────────────────┘ └──────────────────────┘     │
├─────────────────────────────────────────────────────────┤
│ 🛡️ Users by Role                                        │
│ [Super Admin: 1] [Manager: 2] [Foreman: 3] [Ops: 10]  │
├─────────────────────────────────────────────────────────┤
│ 🔄 Recent Activity                                      │
│ • John Doe logged in - 5m ago                          │
│ • Jane Smith created VoO - 15m ago                     │
│ • Admin updated role - 1h ago                          │
└─────────────────────────────────────────────────────────┘
```

### Key Features:
- 4 overview stat cards
- VoO submission statistics
- Misconduct records count
- User distribution chart
- Recent activity feed (last 10)
- Real-time updates
- Refresh button

---

## 👥 Users Page

### URL: `/superadmin/users`

### Visual Layout:
```
┌─────────────────────────────────────────────────────────┐
│ [👥 Icon] User Management               [➕ Add User]  │
│ Manage system users and permissions                     │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Total: 15│ │ Active:14│ │ Inactive:│ │ Roles: 4 │   │
│ │          │ │          │ │    1     │ │          │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│ [🔍 Search...] [Filter: All Roles ▼] [🔄 Refresh]     │
├─────────────────────────────────────────────────────────┤
│ User          │ Role      │ Status  │ Activity  │ ⚙️   │
│───────────────┼───────────┼─────────┼───────────┼──────│
│ John Doe      │ Foreman   │ ✅ Act  │ VoO: 10  │ ✏️🔄🔑🗑│
│ @johndoe      │           │         │ Logs: 50  │      │
│───────────────┼───────────┼─────────┼───────────┼──────│
│ Jane Smith    │ Operator  │ ✅ Act  │ VoO: 5   │ ✏️🔄🔑🗑│
│ @janesmith    │           │         │ Logs: 20  │      │
└─────────────────────────────────────────────────────────┘
```

### Actions Available:
- ✏️ Edit - Modify user details
- 🔄 Toggle Status - Active/Inactive
- 🔑 Reset Password - Change password
- 🗑️ Delete - Remove user (not Super Admin)

### Modal Form:
```
┌────────────────────────────────────┐
│ Create/Edit User                   │
├────────────────────────────────────┤
│ Username:  [__________________]    │
│ Email:     [__________________]    │
│ Full Name: [__________________]    │
│ NIP:       [__________________]    │
│ Role:      [Select Role      ▼]    │
│ Password:  [__________________]    │
│ ☐ Active User                      │
├────────────────────────────────────┤
│           [Cancel] [Save]          │
└────────────────────────────────────┘
```

---

## 🛡️ Roles Page

### URL: `/superadmin/roles`

### Visual Layout:
```
┌─────────────────────────────────────────────────────────┐
│ [🛡️ Icon] Role Management              [➕ Add Role]   │
│ Manage roles and permissions                            │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Total: 5 │ │ System:4 │ │ Custom:1 │ │ Users:15 │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│ [🔍 Search...] [🔄 Refresh]                            │
├─────────────────────────────────────────────────────────┤
│ Role             │ Type    │ Users │ Permissions │ ⚙️  │
│──────────────────┼─────────┼───────┼─────────────┼─────│
│ 🛡️ Super Admin   │ System  │  1    │ Full Access │ ✏️  │
│ System role      │         │       │             │     │
│──────────────────┼─────────┼───────┼─────────────┼─────│
│ 👔 Manager       │ System  │  2    │ 15 perms    │ ✏️  │
│ Section Manager  │         │       │             │     │
│──────────────────┼─────────┼───────┼─────────────┼─────│
│ 👨‍🔧 Foreman      │ System  │  3    │ 10 perms    │ ✏️  │
│ Team leader      │         │       │             │     │
│──────────────────┼─────────┼───────┼─────────────┼─────│
│ 🔍 Inspector     │ Custom  │  0    │ 5 perms     │ ✏️🗑│
│ Quality control  │         │       │             │     │
└─────────────────────────────────────────────────────────┘
```

### Permission Matrix:
```
┌────────────────────────────────────┐
│ Edit Role: Quality Inspector       │
├────────────────────────────────────┤
│ Name:        [________________]    │
│ Description: [________________]    │
│                                    │
│ Permissions:                       │
│ ☑️ VoO / Ide Kaizen               │
│   ☑️ View VoO Submissions         │
│   ☑️ Approve as Foreman           │
│   ☐ Approve as Manager            │
│   ☐ Reject Submissions            │
│                                    │
│ ☐ Misconduct                      │
│   ☐ View Misconducts              │
│   ☐ Create Misconducts            │
│   ☐ Edit Misconducts              │
│                                    │
│ ☑️ Operators                      │
│   ☑️ View Operators               │
│   ☑️ View Performance             │
│   ☐ Edit Operators                │
│                                    │
│ [12 permissions selected]          │
├────────────────────────────────────┤
│           [Cancel] [Save]          │
└────────────────────────────────────┘
```

---

## 📍 QR Locations Page

### URL: `/superadmin/qr-locations`

### Visual Layout:
```
┌─────────────────────────────────────────────────────────┐
│ [📍] QR Location Management  [⬇️ Download All] [➕ Add] │
│ Manage QR code locations for attendance tracking        │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Locs: 5  │ │ Scans:150│ │ Areas: 3 │ │ Avg: 30  │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│ [🔍 Search...] [🔄 Refresh]                            │
├─────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│ │📍 Main Gate│ │📍 Area A   │ │📍 Area B   │          │
│ │GATE-01     │ │PROD-A-01   │ │PROD-B-01   │          │
│ │Security    │ │Production A│ │Production B│          │
│ │            │ │            │ │            │          │
│ │  ┌──────┐  │ │  ┌──────┐  │ │  ┌──────┐  │          │
│ │  │ QR   │  │ │  │ QR   │  │ │  │ QR   │  │          │
│ │  │ CODE │  │ │  │ CODE │  │ │  │ CODE │  │          │
│ │  └──────┘  │ │  └──────┘  │ │  └──────┘  │          │
│ │            │ │            │ │            │          │
│ │🔄 50 scans │ │🔄 45 scans │ │🔄 30 scans │          │
│ │            │ │            │ │            │          │
│ │[👁️View]    │ │[👁️View]    │ │[👁️View]    │          │
│ │[⬇️Download]│ │[⬇️Download]│ │[⬇️Download]│          │
│ │[✏️Edit]    │ │[✏️Edit]    │ │[✏️Edit]    │          │
│ │[🗑️Delete]  │ │[🗑️Delete]  │ │[🗑️Delete]  │          │
│ └────────────┘ └────────────┘ └────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### QR View Modal:
```
┌────────────────────────────────────┐
│ Main Gate                          │
│ Code: GATE-01                      │
│ Area: Security Area                │
├────────────────────────────────────┤
│         ┌──────────────┐           │
│         │              │           │
│         │   ▄▄▄▄▄▄▄   │           │
│         │   █ ▄▄▄ █   │           │
│         │   █ ███ █   │           │
│         │   ▀▀▀▀▀▀▀   │           │
│         │   QR CODE   │           │
│         │              │           │
│         └──────────────┘           │
│                                    │
├────────────────────────────────────┤
│      [⬇️ Download] [✖️ Close]      │
└────────────────────────────────────┘
```

---

## 📋 Audit Logs Page

### URL: `/superadmin/audit`

### Visual Layout:
```
┌─────────────────────────────────────────────────────────┐
│ [📋] Audit Logs                     [⬇️ Export CSV]     │
│ System activity and event tracking                      │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Total:500│ │ Users:15 │ │ Mods: 8  │ │ Today:25 │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│ 🔍 Filters:                                             │
│ [Module ▼] [Action ▼] [Start Date] [End Date] [Reset] │
├─────────────────────────────────────────────────────────┤
│ [🔍 Search by user, action, module, or details...]     │
├─────────────────────────────────────────────────────────┤
│ Time              │User      │Action│Module│Details│IP │
│───────────────────┼──────────┼──────┼──────┼───────┼───│
│ Jun 18, 10:30 AM  │John Doe  │LOGIN │auth  │Success│::1│
│                   │@johndoe  │      │      │       │   │
│                   │Foreman   │      │      │       │   │
│───────────────────┼──────────┼──────┼──────┼───────┼───│
│ Jun 18, 10:25 AM  │Jane Smith│CREATE│voo   │New VoO│::1│
│                   │@janesmith│      │      │#123   │   │
│                   │Operator  │      │      │       │   │
│───────────────────┼──────────┼──────┼──────┼───────┼───│
│ Jun 18, 10:20 AM  │Super Adm │UPDATE│users │Edit   │::1│
│                   │@admin    │      │      │user#5 │   │
│                   │Super Adm │      │      │       │   │
└─────────────────────────────────────────────────────────┘
```

### Action Color Codes:
- 🟦 LOGIN - Blue
- ⚪ LOGOUT - Gray
- 🟩 CREATE - Green
- 🟨 UPDATE - Yellow
- 🟥 DELETE - Red
- 🟪 APPROVE - Purple
- 🟧 REJECT - Orange

---

## 🎨 Common UI Elements

### Sidebar Navigation:
```
┌─────────────────────┐
│ 🛡️ Super Admin      │
├─────────────────────┤
│ 📊 Dashboard        │ ← Purple highlight when active
│ 👥 Users            │
│ 🛡️ Roles            │
│ 📍 QR Locations     │
│ 📋 Audit Logs       │
├─────────────────────┤
│ John Doe            │
│ Super Admin         │
│ [🚪 Logout]         │
└─────────────────────┘
```

### Mobile View:
```
┌─────────────────────┐
│ ☰  🛡️ Super Admin  │
└─────────────────────┘
```

When hamburger menu clicked:
```
┌─────────────────────┐
│ 🛡️ Super Admin  ✖️  │
├─────────────────────┤
│ 📊 Dashboard        │
│ 👥 Users            │
│ 🛡️ Roles            │
│ 📍 QR Locations     │
│ 📋 Audit Logs       │
├─────────────────────┤
│ John Doe            │
│ Super Admin         │
│ [🚪 Logout]         │
└─────────────────────┘
```

### Stats Card Template:
```
┌──────────────────────┐
│ Label Text           │
│ 99                   │ ← Large number
│ subtitle info        │ ← Small text
│              [Icon]  │ ← Right-aligned icon
└──────────────────────┘
```

### Modal Template:
```
┌─────────────────────────────────────┐
│ Modal Title                         │
├─────────────────────────────────────┤
│ Form fields or content here         │
│                                     │
│                                     │
├─────────────────────────────────────┤
│              [Cancel] [Save]        │
└─────────────────────────────────────┘
```

### Table Template:
```
┌─────────────────────────────────────┐
│ Column 1   │ Column 2  │ Actions    │
├────────────┼───────────┼────────────┤
│ Data 1     │ Data 2    │ ✏️ 🗑️      │
│ Subtext    │           │            │
├────────────┼───────────┼────────────┤
│ Data 3     │ Data 4    │ ✏️ 🗑️      │
└─────────────────────────────────────┘
```

---

## 🎯 Navigation Flow

### Login Flow:
```
Login Page
   ↓ (success)
Dashboard
```

### Page Navigation:
```
Any Super Admin Page
   ↓ (click sidebar)
Another Super Admin Page
   ↓ (maintains layout)
```

### CRUD Flow:
```
List Page
   ↓ (click Add button)
Modal Form (Create)
   ↓ (submit)
List Page (updated)
```

```
List Page
   ↓ (click Edit icon)
Modal Form (Edit)
   ↓ (submit)
List Page (updated)
```

```
List Page
   ↓ (click Delete icon)
Confirm Dialog
   ↓ (confirm)
List Page (item removed)
```

---

## 📱 Responsive Breakpoints

### Desktop (lg: 1024px+):
- Sidebar always visible (left)
- Content area: max-width 1280px
- 4-column stat cards
- Full-width tables

### Tablet (md: 768px - 1023px):
- Sidebar hidden (hamburger menu)
- Content area: full width
- 2-column stat cards
- Scrollable tables

### Mobile (< 768px):
- Sidebar hidden (hamburger menu)
- Content area: full width, padding reduced
- 1-column stat cards
- Horizontal scroll tables
- Stacked form fields

---

## 🎨 Color Reference

### Brand Colors:
- **Purple** (#7C3AED) - Primary, Super Admin, Actions
- **Purple Hover** (#9333EA) - Button hover states

### Status Colors:
- **Green** (#10B981) - Success, Active, Approved
- **Red** (#EF4444) - Danger, Inactive, Delete
- **Yellow** (#F59E0B) - Warning, Pending
- **Blue** (#3B82F6) - Info, View
- **Orange** (#F97316) - Alert

### UI Colors:
- **Gray 50** (#F9FAFB) - Background
- **Gray 100** (#F3F4F6) - Card hover
- **Gray 200** (#E5E7EB) - Borders
- **Gray 500** (#6B7280) - Text secondary
- **Gray 900** (#111827) - Text primary
- **White** (#FFFFFF) - Cards, modals

---

## 🔐 Access Control

### Required Role: Super Admin

### Blocked Access:
```
Other Roles (Manager, Foreman, Operator)
   ↓ (try to access /superadmin/*)
403 Forbidden
   ↓
Redirect to Dashboard or Login
```

### Protected Actions:
- ❌ Delete Super Admin user
- ❌ Rename system roles
- ❌ Delete system roles
- ❌ Delete roles with users
- ✅ All other actions allowed

---

## 📊 Data Flow

### Read Operations:
```
Frontend ← [GET] ← Backend ← Database
```

### Create Operations:
```
Frontend → [POST] → Backend → Database
                              ↓
                         Auto-generate
                         (QR codes, hashes)
```

### Update Operations:
```
Frontend → [PUT] → Backend → Validate → Database
```

### Delete Operations:
```
Frontend → Confirm → [DELETE] → Backend → Check → Database
                                          (dependencies)
```

---

## 🎉 Complete Feature Set

### ✅ Implemented:
- Dashboard (Overview + Stats)
- User Management (Full CRUD)
- Role Management (Full CRUD + Permissions)
- QR Location Management (Full CRUD + QR Generation)
- Audit Logs (View + Filter + Export)
- Responsive Layout
- Mobile Navigation
- Search & Filters
- Export Functionality
- Security Controls
- Loading States
- Error Handling

### 🎯 Ready to Use:
All pages are production-ready and can be accessed immediately after starting the backend and frontend servers.

---

**Visual Guide Complete!** 📋

Use this guide to understand the layout, navigation, and features of each Super Admin page.
