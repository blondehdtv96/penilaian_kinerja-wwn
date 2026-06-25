import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth';
import { useNotificationsStore } from './notifications';
import type { NotificationDTO } from '@/services/notifications.service';

type Handler = (...args: any[]) => void;

// Store TRANSPORT saja: kelola koneksi socket + dispatch event ke store/halaman lain.
// State inbox ada di stores/notifications.ts; event domain dipakai composable useRealtime.
export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);

  // Registry listener domain. Penting: sebuah halaman (komponen anak) menjalankan
  // onMounted SEBELUM App.vue (induk) memanggil connect() — jadi listener bisa
  // didaftarkan saat socket belum ada. Registry ini dipasang ulang di attachAll()
  // begitu socket dibuat, sekaligus bertahan lintas (re)connect.
  const domainListeners = new Map<string, Set<Handler>>();

  const attachAll = () => {
    if (!socket.value) return;
    domainListeners.forEach((handlers, event) => {
      handlers.forEach((h) => socket.value!.on(event, h));
    });
  };

  const connect = () => {
    if (socket.value) return; // sudah ada koneksi/instance — jangan buat ganda
    const auth = useAuthStore();
    if (!auth.token) return;

    // Tanpa URL → same-origin, di-proxy Vite ke :3001. Token via handshake auth;
    // backend memverifikasi & menempatkan socket ke room user:<id> + role:<peran>.
    const url = import.meta.env.VITE_SOCKET_URL;
    const opts = { auth: { token: auth.token } };
    socket.value = url ? io(url, opts) : io(opts);

    const notifications = useNotificationsStore();

    socket.value.on('connect', () => {
      connected.value = true;
      notifications.fetch(); // sinkronkan inbox tiap (re)connect
    });
    socket.value.on('disconnect', () => {
      connected.value = false;
    });
    socket.value.on('connect_error', (err: Error) => {
      connected.value = false;
      if (import.meta.env.DEV) console.warn('[socket] connect_error:', err.message);
    });

    // Event kanonik inbox — satu pintu untuk semua kategori notifikasi.
    socket.value.on('notification:new', (n: NotificationDTO) => notifications.receive(n));

    attachAll(); // pasang listener domain yang sudah terdaftar sebelum socket dibuat
  };

  const disconnect = () => {
    socket.value?.disconnect();
    socket.value = null;
    connected.value = false;
    useNotificationsStore().reset();
  };

  // Dipakai composable useRealtime untuk event domain (voo:changed / record:changed).
  const on = (event: string, handler: Handler) => {
    if (!domainListeners.has(event)) domainListeners.set(event, new Set());
    domainListeners.get(event)!.add(handler);
    socket.value?.on(event, handler);
  };
  const off = (event: string, handler: Handler) => {
    domainListeners.get(event)?.delete(handler);
    socket.value?.off(event, handler);
  };

  return { socket, connected, connect, disconnect, on, off };
});
