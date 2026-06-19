import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth';

export interface AppNotification {
  id: number;
  title: string;
  data: unknown;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);
  const notifications = ref<AppNotification[]>([]);

  const push = (title: string, data: unknown, type: AppNotification['type']) => {
    notifications.value.unshift({ id: Date.now(), title, data, type, timestamp: new Date() });
    if (notifications.value.length > 50) notifications.value = notifications.value.slice(0, 50);
  };

  const connect = () => {
    if (socket.value?.connected) return;
    const auth = useAuthStore();

    // Tanpa URL → same-origin, di-proxy Vite ke :3001 (hindari CORS). Override via VITE_SOCKET_URL.
    const url = import.meta.env.VITE_SOCKET_URL;
    const opts = { auth: { token: auth.token } };
    socket.value = url ? io(url, opts) : io(opts);

    socket.value.on('connect', () => {
      connected.value = true;
      const u = auth.user;
      if (u?.role) socket.value?.emit('join', u.role);
      if (u?.operator?.id) socket.value?.emit('join', `operator:${u.operator.id}`);
    });
    socket.value.on('disconnect', () => {
      connected.value = false;
    });

    socket.value.on('voo:created', (d: unknown) => push('VoO/Ide Kaizen baru diajukan', d, 'info'));
    socket.value.on('voo:approved', (d: unknown) => push('VoO/Ide Kaizen disetujui', d, 'success'));
    socket.value.on('misconduct:created', (d: unknown) => push('Pelanggaran tercatat', d, 'warning'));
  };

  const disconnect = () => {
    socket.value?.disconnect();
    socket.value = null;
    connected.value = false;
  };

  const clear = () => {
    notifications.value = [];
  };

  return { socket, connected, notifications, connect, disconnect, clear };
});
