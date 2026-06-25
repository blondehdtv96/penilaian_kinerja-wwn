import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

// Payload JWT (lihat auth.middleware.ts): { userId, role, permissions }.
interface SocketUser {
  userId: number;
  role: string;
  permissions?: string[];
}

/**
 * Wiring tunggal untuk Socket.IO:
 * 1) Handshake diautentikasi pakai JWT yang sama dengan REST (io.use).
 * 2) Room diturunkan HANYA dari token terverifikasi (user:<id> & role:<peran>),
 *    bukan dari pesan 'join' yang dikirim client — menutup celah seorang operator
 *    ikut "menguping" room manajer.
 */
export const initSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('No token provided'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    socket.join(`user:${user.userId}`);
    if (user.role) socket.join(`role:${user.role}`);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Socket connected: user ${user.userId} (${user.role})`);
    }

    socket.on('disconnect', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`❌ Socket disconnected: user ${user.userId}`);
      }
    });
  });
};
