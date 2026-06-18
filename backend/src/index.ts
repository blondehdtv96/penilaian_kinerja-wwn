import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './auth/auth.routes';
import operatorRoutes from './operators/operators.routes';
import vooRoutes from './voo/voo.routes';
import misconductRoutes from './misconduct/misconduct.routes';
import blockchainRoutes from './blockchain/blockchain.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import qrLocationRoutes from './qr-locations/qr-locations.routes';
import userRoutes from './users/users.routes';
import roleRoutes from './roles/roles.routes';
import superadminRoutes from './superadmin/superadmin.routes';
import { getAuditLogs } from './middleware/audit.middleware';
import { authMiddleware, checkRole } from './middleware/auth.middleware';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'VoO / Ide Kaizen API is running', version: '2.0.0' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/voo', vooRoutes);
app.use('/api/records', misconductRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/qr-locations', qrLocationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/superadmin', superadminRoutes);

app.get('/api/audit-logs', authMiddleware, checkRole(['Section Manager']), getAuditLogs);

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (room: string) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in services
export { io };

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  POST /api/auth/login`);
  console.log(`  GET  /api/auth/me`);
  console.log(`  GET  /api/operators`);
  console.log(`  GET  /api/operators/ranking`);
  console.log(`  POST /api/operators/scan-qr`);
  console.log(`  GET  /api/voo`);
  console.log(`  POST /api/voo`);
  console.log(`  POST /api/voo/:id/approve-foreman`);
  console.log(`  POST /api/voo/:id/approve-manager`);
  console.log(`  POST /api/records/misconduct`);
  console.log(`  POST /api/records/counseling`);
  console.log(`  POST /api/records/kartu-kuning`);
  console.log(`  POST /api/records/surat-peringatan`);
  console.log(`  GET  /api/blockchain/status`);
  console.log(`  GET  /api/dashboard/kpi`);
  console.log(`  GET  /api/dashboard/export/excel`);
  console.log(`  GET  /api/qr-locations`);
  console.log(`  GET  /api/users`);
  console.log(`  GET  /api/roles`);
  console.log(`  GET  /api/audit-logs`);
});
