# 📦 Panduan Instalasi Lengkap

## Sistem Merit-Misconduct - PT Bridgestone Tire Indonesia

---

## 📋 Prasyarat

Pastikan sudah terinstall:

1. **Node.js** (v18 atau lebih tinggi)
   - Download: https://nodejs.org/
   - Cek versi: `node --version`

2. **NPM** (biasanya sudah include dengan Node.js)
   - Cek versi: `npm --version`

3. **Git** (optional, untuk clone repository)
   - Download: https://git-scm.com/

---

## 🚀 Instalasi Backend

### 1. Masuk ke folder backend

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit file `.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="bridgestone-secret-key-2024-production"
JWT_EXPIRES_IN="7d"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run database migration

```bash
npm run prisma:migrate
```

Beri nama migration: `init` (tekan Enter)

### 6. (Optional) Seed initial data

Buat file `prisma/seed.ts` untuk data awal, lalu:

```bash
npm run prisma:db:seed
```

### 7. Start backend server

```bash
npm run dev
```

Backend akan berjalan di: **http://localhost:3001**

Cek health: http://localhost:3001/health

---

## 🎨 Instalasi Frontend

### 1. Buka terminal baru, masuk ke folder frontend

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit file `.env`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

### 4. Start frontend development server

```bash
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

---

## 🗄️ Database Management

### Prisma Studio (Database GUI)

```bash
cd backend
npm run prisma:studio
```

Akan terbuka di: **http://localhost:5555**

### Reset Database

```bash
npm run prisma:migrate:reset
```

### Create New Migration

```bash
npm run prisma:migrate
```

---

## 🔑 Initial Setup

### 1. Buat Genesis Block Blockchain

```bash
# Via API
POST http://localhost:3001/api/blockchain/genesis
```

Atau gunakan Postman/Thunder Client.

### 2. Create Super Admin User

Menggunakan Prisma Studio atau seed script:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const superAdminRole = await prisma.role.create({
    data: { name: 'Super Admin', description: 'Full system access' }
  });

  // Create super admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.create({
    data: {
      username: 'superadmin',
      email: 'admin@bridgestone.com',
      password: hashedPassword,
      fullName: 'Super Administrator',
      userRoles: {
        create: {
          roleId: superAdminRole.id
        }
      }
    }
  });

  console.log('Super Admin created:', superAdmin);
}

main();
```

### 3. Login ke Aplikasi

- URL: http://localhost:5173/login
- Username: `superadmin`
- Password: `admin123`

---

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm run test
```

### Frontend Testing

```bash
cd frontend
npm run test:unit
```

---

## 🐛 Troubleshooting

### Port sudah digunakan

**Backend (3001):**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

**Frontend (5173):**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5173
kill -9 <PID>
```

### Prisma Error

```bash
cd backend
rm -rf node_modules
rm package-lock.json
npm install
npm run prisma:generate
```

### CORS Error

Pastikan `CORS_ORIGIN` di backend `.env` sesuai dengan URL frontend.

### Socket.IO Connection Failed

- Cek backend sudah running
- Cek `VITE_SOCKET_URL` di frontend `.env`
- Cek firewall/antivirus tidak memblokir

---

## 📦 Production Build

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Output ada di folder dist/
```

Deploy folder `dist/` ke web server (Apache/Nginx).

---

## 🔒 Security Checklist

- [ ] Ganti `JWT_SECRET` dengan random string yang kuat
- [ ] Ganti password default super admin
- [ ] Setup HTTPS untuk production
- [ ] Enable rate limiting
- [ ] Setup backup database
- [ ] Configure firewall rules
- [ ] Enable audit logging

---

## 📞 Support

Jika ada masalah:
1. Cek log di terminal
2. Cek browser console (F12)
3. Restart backend & frontend
4. Clear browser cache
5. Reinstall node_modules

---

## ✅ Checklist Instalasi

Backend:
- [ ] Node.js installed
- [ ] Dependencies installed
- [ ] .env configured
- [ ] Database migrated
- [ ] Genesis block created
- [ ] Super admin created
- [ ] Server running on port 3001

Frontend:
- [ ] Dependencies installed
- [ ] .env configured
- [ ] Server running on port 5173
- [ ] Can access login page
- [ ] Can login successfully

---

**Selamat! Sistem Merit-Misconduct siap digunakan! 🎉**
