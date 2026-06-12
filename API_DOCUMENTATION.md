# 📚 API Documentation

## Merit-Misconduct System API

Base URL: `http://localhost:3001/api`

---

## 🔐 Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "superadmin",
      "email": "admin@bridgestone.com",
      "fullName": "Super Administrator",
      "roles": ["Super Admin"],
      "permissions": ["user.view", "user.create", ...]
    }
  }
}
```

### Register
```http
POST /auth/register
Content-Type: application/json
Authorization: Bearer {token}

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "fullName": "New User",
  "roleId": 2
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👥 Users Management

### Get All Users
```http
GET /users
Authorization: Bearer {token}
```

### Get User by ID
```http
GET /users/:id
Authorization: Bearer {token}
```

### Create User
```http
POST /users
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "fullName": "New User",
  "roleIds": [2, 3]
}
```

### Update User
```http
PUT /users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newemail@example.com",
  "fullName": "Updated Name",
  "roleIds": [2]
}
```

### Toggle User Status
```http
PATCH /users/:id/toggle-status
Authorization: Bearer {token}
```

### Delete User
```http
DELETE /users/:id
Authorization: Bearer {token}
```

---

## 🎭 Roles & Permissions

### Get All Roles
```http
GET /roles
Authorization: Bearer {token}
```

### Create Role
```http
POST /roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Custom Role",
  "description": "Custom role description",
  "permissionIds": [1, 2, 3, 4]
}
```

### Update Role
```http
PUT /roles/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Role",
  "description": "Updated description",
  "permissionIds": [1, 2, 5]
}
```

### Get All Permissions
```http
GET /permissions
Authorization: Bearer {token}
```

### Get Permissions by Module
```http
GET /permissions/grouped
Authorization: Bearer {token}
```

---

## 👷 Operators Management

### Get All Operators
```http
GET /operators
Authorization: Bearer {token}

Query Parameters:
- departmentId: number (optional)
- shiftId: number (optional)
- productionLineId: number (optional)
```

### Get Operator by ID
```http
GET /operators/:id
Authorization: Bearer {token}
```

### Get Operator by Employee ID
```http
GET /operators/employee/:employeeId
Authorization: Bearer {token}
```

### Get Operator Ranking
```http
GET /operators/ranking?limit=10
Authorization: Bearer {token}
```

### Create Operator
```http
POST /operators
Authorization: Bearer {token}
Content-Type: application/json

{
  "employeeId": "EMP1001",
  "userId": 5,
  "departmentId": 1,
  "shiftId": 1,
  "productionLineId": 1,
  "position": "Assembly Operator"
}
```

### Update Operator
```http
PUT /operators/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "departmentId": 2,
  "shiftId": 2,
  "productionLineId": 1,
  "position": "Senior Operator"
}
```

---

## ⭐ Merit Events

### Get All Merits
```http
GET /merit
Authorization: Bearer {token}

Query Parameters:
- status: string (pending|approved|rejected)
- dateFrom: string (ISO date)
- dateTo: string (ISO date)
```

### Get Merits by Operator
```http
GET /merit/operator/:operatorId?status=approved
Authorization: Bearer {token}
```

### Create Merit
```http
POST /merit
Authorization: Bearer {token}
Content-Type: application/json

{
  "operatorId": 1,
  "productionLineId": 1,
  "meritType": "Production Target Achieved",
  "points": 10,
  "description": "Exceeded daily production target by 20%"
}
```

### Approve Merit
```http
PUT /merit/:id/approve
Authorization: Bearer {token}
```

### Reject Merit
```http
PUT /merit/:id/reject
Authorization: Bearer {token}
```

---

## ⚠️ Misconduct Events

### Get All Misconducts
```http
GET /misconduct
Authorization: Bearer {token}

Query Parameters:
- status: string (pending|approved|rejected)
- severity: string (low|medium|high|critical)
- dateFrom: string (ISO date)
- dateTo: string (ISO date)
```

### Get Misconducts by Operator
```http
GET /misconduct/operator/:operatorId?status=approved
Authorization: Bearer {token}
```

### Create Misconduct
```http
POST /misconduct
Authorization: Bearer {token}
Content-Type: application/json

{
  "operatorId": 1,
  "productionLineId": 1,
  "misconductType": "Late Arrival",
  "severity": "low",
  "points": 5,
  "description": "Arrived 15 minutes late without notice"
}
```

### Approve Misconduct
```http
PUT /misconduct/:id/approve
Authorization: Bearer {token}
```

### Reject Misconduct
```http
PUT /misconduct/:id/reject
Authorization: Bearer {token}
```

---

## 🔗 Blockchain

### Get Blockchain
```http
GET /blockchain?page=1&limit=50
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "blocks": [
      {
        "blockIndex": 10,
        "previousHash": "00abc123...",
        "currentHash": "00def456...",
        "timestamp": "2024-01-15T10:30:00Z",
        "eventType": "merit",
        "eventId": 5,
        "data": "{...}",
        "nonce": 1234,
        "isValid": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

### Get Block by Index
```http
GET /blockchain/:blockIndex
Authorization: Bearer {token}
```

### Verify Blockchain
```http
GET /blockchain/verify
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "totalBlocks": 100,
    "invalidBlocks": [],
    "message": "Chain is valid"
  }
}
```

### Initialize Genesis Block
```http
POST /blockchain/genesis
Authorization: Bearer {token}
```

---

## 📊 Dashboard

### Get KPI Dashboard
```http
GET /dashboard/kpi
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOperators": 50,
      "totalMerits": 234,
      "totalMisconducts": 45,
      "pendingMerits": 12,
      "pendingMisconducts": 3,
      "totalBlocks": 279
    },
    "topPerformers": [...],
    "recentMerits": [...],
    "recentMisconducts": [...]
  }
}
```

### Get Performance Chart
```http
GET /dashboard/performance-chart?period=daily
Authorization: Bearer {token}

Query Parameters:
- period: string (daily|weekly|monthly)
```

---

## 📈 Reports

### Operator Performance Report
```http
GET /reports/operator-performance
Authorization: Bearer {token}

Query Parameters:
- departmentId: number (optional)
- dateFrom: string (optional)
- dateTo: string (optional)
```

### Merit-Misconduct Report
```http
GET /reports/merit-misconduct
Authorization: Bearer {token}

Query Parameters:
- dateFrom: string (optional)
- dateTo: string (optional)
```

### Department Report
```http
GET /reports/department
Authorization: Bearer {token}
```

### Blockchain Audit Report
```http
GET /reports/blockchain-audit
Authorization: Bearer {token}

Query Parameters:
- eventType: string (merit|misconduct)
- dateFrom: string (optional)
- dateTo: string (optional)
```

---

## 🔌 Socket.IO Events

### Connection
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
```

### Join Rooms
```javascript
socket.emit('join:operator', operatorId);
socket.emit('join:supervisor');
socket.emit('join:hrd');
socket.emit('join:manager');
```

### Listen to Events
```javascript
// Merit events
socket.on('merit:created', (data) => {
  console.log('New merit created:', data);
});

socket.on('merit:approved', (data) => {
  console.log('Merit approved:', data);
});

// Misconduct events
socket.on('misconduct:created', (data) => {
  console.log('New misconduct created:', data);
});

socket.on('misconduct:approved', (data) => {
  console.log('Misconduct approved:', data);
});
```

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## 🔒 Authorization

### Headers
All protected endpoints require JWT token:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Role-Based Access

| Endpoint | Super Admin | Manager | Staff Produksi | Foreman | Operator |
|----------|------------|---------|---------------|---------|----------|
| Users    | yes | - | - | - | - |
| Roles    | yes | - | - | - | - |
| Permissions | yes | - | - | - | - |
| Operators CRUD | yes | - | yes | - | - |
| Operators View | yes | - | yes | yes (scan) | yes (self) |
| Merit Create | yes | - | - | yes | - |
| Merit Approve | yes | - | yes | - | - |
| Merit View | yes | - | yes | yes (own) | yes (own) |
| Misconduct Create | yes | - | - | yes | - |
| Misconduct Approve | yes | - | yes | - | - |
| Misconduct View | yes | - | yes | yes (own) | yes (own) |
| Blockchain | yes | yes | - | - | - |
| Reports | yes | - | yes | - | - |
| Dashboard KPI | yes | yes | yes | - | yes (personal) |

---

## 🧪 Testing with cURL

### Login Example
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"admin123"}'
```

### Get Operators Example
```bash
curl -X GET http://localhost:3001/api/operators \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Merit Example
```bash
curl -X POST http://localhost:3001/api/merit \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "operatorId": 1,
    "productionLineId": 1,
    "meritType": "Production Excellence",
    "points": 15,
    "description": "Outstanding performance"
  }'
```

---

## 📦 Postman Collection

Import this into Postman for quick testing:
- Collection: `Merit-Misconduct-API.postman_collection.json`
- Environment: `Merit-Misconduct-Local.postman_environment.json`

---

**API Version:** 1.0.0  
**Last Updated:** 2024  
**Base URL:** http://localhost:3001/api
