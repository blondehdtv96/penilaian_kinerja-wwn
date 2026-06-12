import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './auth/auth.routes';
import userRoutes from './users/users.routes';
import roleRoutes from './roles/roles.routes';
import permissionRoutes from './permissions/permissions.routes';
import operatorRoutes from './operators/operators.routes';
import meritRoutes from './merit/merit.routes';
import misconductRoutes from './misconduct/misconduct.routes';
import blockchainRoutes from './blockchain/blockchain.routes';
import reportRoutes from './reports/reports.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import { initSocketHandlers } from './socket/socket.handlers';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/merit', meritRoutes);
app.use('/api/misconduct', misconductRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO initialization
initSocketHandlers(io);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for real-time events`);
});

export { io };
