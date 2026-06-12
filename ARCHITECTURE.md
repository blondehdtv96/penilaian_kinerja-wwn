# 🏗️ System Architecture

## Merit-Misconduct System - PT Bridgestone Tire Indonesia

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web Browser │  │  Mobile App  │  │   Tablet     │     │
│  │  (Vue.js +   │  │  (Capacitor) │  │              │     │
│  │   Ionic)     │  └──────────────┘  └──────────────┘     │
│  └──────────────┘                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS / WebSocket
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Nginx Reverse Proxy                      │  │
│  │  • SSL Termination  • Load Balancing  • Caching     │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Next.js 15 + Express.js Backend             │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │   Auth     │  │   RBAC     │  │  Middleware│    │  │
│  │  │  Service   │  │  Service   │  │   Layer    │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  │                                                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │   Merit    │  │ Misconduct │  │  Operator  │    │  │
│  │  │  Service   │  │  Service   │  │   Service  │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  │                                                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ Blockchain │  │  Dashboard │  │   Report   │    │  │
│  │  │  Service   │  │  Service   │  │   Service  │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 REAL-TIME LAYER                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Socket.IO Server                    │  │
│  │  • Merit Events  • Misconduct Events  • Notifications│  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Prisma ORM + SQLite                      │  │
│  │  • Users  • Roles  • Operators  • Events  • Logs    │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               BLOCKCHAIN LAYER                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           SHA-256 Hash Chain (On-Chain)              │  │
│  │  Genesis Block → Block 1 → Block 2 → ... → Block N  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### 1. Authentication Flow

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────┐
│ Client  │─────▶│  Nginx  │─────▶│ Backend  │─────▶│ Database │
└─────────┘      └─────────┘      └──────────┘      └──────────┘
    │                                    │
    │  POST /auth/login                 │
    │  { username, password }            │
    │                                    │
    │◀──────────────────────────────────│
    │  { token, user }                   │
    │                                    │
    │  Store token in localStorage       │
    │  Connect to Socket.IO              │
    └────────────────────────────────────┘
```

### 2. Merit Creation & Blockchain Flow

```
┌──────────┐   ┌─────────┐   ┌──────────────┐   ┌────────────┐
│Supervisor│   │ Backend │   │  Blockchain  │   │  Database  │
└────┬─────┘   └────┬────┘   └──────┬───────┘   └─────┬──────┘
     │              │                │                  │
     │ POST /merit  │                │                  │
     ├─────────────▶│                │                  │
     │              │  Create Merit  │                  │
     │              ├───────────────▶│                  │
     │              │                │  Save Merit      │
     │              │                ├─────────────────▶│
     │              │                │                  │
     │              │  Calc Hash     │                  │
     │              │◀───────────────┤                  │
     │              │                │  Save Block      │
     │              │                ├─────────────────▶│
     │              │                │                  │
     │              │  Emit Socket   │                  │
     │              ├────────────────┼──────────────────┤
     │              │                │  (Broadcast)     │
     │◀─────────────┤                │                  │
     │  Response    │                │                  │
```

### 3. Real-Time Event Flow

```
┌─────────┐        ┌──────────────┐        ┌─────────┐
│Supervisor│       │  Socket.IO   │        │Operator │
└────┬────┘        └──────┬───────┘        └────┬────┘
     │                    │                     │
     │  Create Merit      │                     │
     ├───────────────────▶│                     │
     │                    │                     │
     │                    │  merit:created      │
     │                    ├────────────────────▶│
     │                    │  { meritId, data }  │
     │                    │                     │
     │                    │  notification       │
     │                    ├────────────────────▶│
     │                    │  "You got +10 pts"  │
```

---

## 🗄️ Database Schema Design

### Entity Relationship Diagram

```
┌─────────┐      ┌──────────┐      ┌─────────────┐
│  User   │──────│UserRole  │──────│    Role     │
└────┬────┘      └──────────┘      └──────┬──────┘
     │                                     │
     │                              ┌──────┴───────┐
     │                              │RolePermission│
     │                              └──────┬───────┘
     │                                     │
     │                              ┌──────┴──────┐
     │                              │ Permission  │
     │                              └─────────────┘
     │
     │           ┌──────────┐
     └───────────│ Operator │
                 └────┬─────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼────┐  ┌───▼───┐  ┌─────▼──────┐
    │ Merit   │  │Miscon-│  │Performance │
    │ Event   │  │duct   │  │    Log     │
    └────┬────┘  └───┬───┘  └────────────┘
         │           │
         └─────┬─────┘
               │
        ┌──────▼───────┐
        │  Blockchain  │
        │     Log      │
        └──────────────┘
```

---

## 🔐 Security Architecture

### Authentication & Authorization Flow

```
┌──────────────────────────────────────────────────────────┐
│                   Security Layers                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Layer 1: JWT Token Authentication                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ • Token expiration: 7 days                       │   │
│  │ • Refresh token mechanism                        │   │
│  │ • Token blacklist for logout                     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  Layer 2: Role-Based Access Control (RBAC)              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ • 5 Roles: Super Admin, HRD, Manager,           │   │
│  │            Supervisor, Operator                   │   │
│  │ • Granular permissions per module                │   │
│  │ • Middleware validation on every request         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  Layer 3: Data Integrity (Blockchain)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ • SHA-256 hashing                                │   │
│  │ • Tamper detection                               │   │
│  │ • Immutable audit trail                          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  Layer 4: Input Validation                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ • Zod schema validation                          │   │
│  │ • SQL injection prevention (Prisma)              │   │
│  │ • XSS protection                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 📦 Module Architecture

### Backend Modules

```
backend/src/
├── auth/               # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.routes.ts
│
├── users/              # User management
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.routes.ts
│
├── operators/          # Operator management
│   ├── operators.controller.ts
│   ├── operators.service.ts
│   └── operators.routes.ts
│
├── merit/              # Merit event handling
│   ├── merit.controller.ts
│   ├── merit.service.ts
│   └── merit.routes.ts
│
├── misconduct/         # Misconduct handling
│   ├── misconduct.controller.ts
│   ├── misconduct.service.ts
│   └── misconduct.routes.ts
│
├── blockchain/         # Blockchain service
│   ├── blockchain.controller.ts
│   ├── blockchain.service.ts
│   └── blockchain.routes.ts
│
├── dashboard/          # Analytics & KPI
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   └── dashboard.routes.ts
│
├── reports/            # Reporting module
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   └── reports.routes.ts
│
├── middleware/         # Custom middleware
│   └── auth.middleware.ts
│
└── socket/             # Real-time events
    └── socket.handlers.ts
```

---

## 🔗 Blockchain Implementation

### Block Structure

```typescript
interface Block {
  blockIndex: number;
  previousHash: string;
  currentHash: string;
  timestamp: DateTime;
  eventType: 'merit' | 'misconduct';
  eventId: number;
  data: string; // JSON stringified
  nonce: number;
  isValid: boolean;
}
```

### Hash Calculation

```
currentHash = SHA256(
  blockIndex +
  previousHash +
  timestamp +
  data +
  nonce
)
```

### Proof of Work

```typescript
while (!currentHash.startsWith('00')) {
  nonce++;
  currentHash = calculateHash(...);
}
```

---

## 🌐 Frontend Architecture

```
frontend/src/
├── pages/              # Page components
│   ├── auth/
│   ├── operators/
│   ├── merit/
│   ├── misconduct/
│   ├── blockchain/
│   └── dashboard/
│
├── components/         # Reusable components
│   ├── layouts/
│   ├── forms/
│   └── cards/
│
├── stores/             # Pinia state management
│   ├── auth.ts
│   └── socket.ts
│
├── services/           # API services
│   ├── api.ts
│   ├── auth.service.ts
│   ├── operator.service.ts
│   └── ...
│
└── router/             # Vue Router
    └── index.ts
```

---

## 📊 Performance Considerations

### Optimization Strategies

1. **Database**
   - Indexed columns: userId, operatorId, blockIndex
   - Connection pooling
   - Query optimization

2. **API**
   - Response caching (Nginx)
   - Pagination for large datasets
   - Lazy loading

3. **Frontend**
   - Code splitting
   - Image optimization
   - Service Worker (PWA)

4. **Real-Time**
   - Socket.IO rooms for targeted events
   - Event throttling
   - Connection pooling

---

## 🔍 Monitoring & Logging

```
┌─────────────────────────────────────────┐
│          Logging Architecture            │
├─────────────────────────────────────────┤
│  Application Logs                        │
│  • Error logs: Backend errors           │
│  • Access logs: API requests            │
│  • Audit logs: User actions             │
│                                          │
│  System Logs                             │
│  • PM2 process logs                     │
│  • Nginx access/error logs              │
│  • Database query logs                  │
│                                          │
│  Blockchain Logs                         │
│  • Block creation events                │
│  • Chain verification results           │
│  • Tamper detection alerts              │
└─────────────────────────────────────────┘
```

---

**Architecture Version:** 1.0  
**Last Updated:** 2024  
**Design Pattern:** Layered Architecture + Microservices Ready
