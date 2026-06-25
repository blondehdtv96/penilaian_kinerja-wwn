import type { Server } from 'socket.io';

// Singleton instance Socket.IO. Disimpan terpisah dari index.ts supaya service
// (notifications, voo, misconduct) bisa mengakses io tanpa circular import ke index.
let _io: Server | null = null;

export const setIo = (io: Server) => {
  _io = io;
};

export const getIo = (): Server => {
  if (!_io) throw new Error('Socket.IO belum diinisialisasi (panggil setIo lebih dulu).');
  return _io;
};
