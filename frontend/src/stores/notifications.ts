import { defineStore } from 'pinia';
import { ref } from 'vue';
import { notificationsService, type NotificationDTO } from '@/services/notifications.service';

// Inbox notifikasi per-user. Sumber kebenaran = DB (REST); socket hanya mendorong
// item baru lewat receive(). Lihat stores/socket.ts (event 'notification:new').
export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<NotificationDTO[]>([]);
  const unread = ref(0);
  const loading = ref(false);

  const fetch = async () => {
    loading.value = true;
    try {
      const { data } = await notificationsService.list();
      if (data?.success) {
        items.value = data.data.items;
        unread.value = data.data.unread;
      }
    } catch {
      /* abaikan — belum login / koneksi bermasalah */
    } finally {
      loading.value = false;
    }
  };

  // Dipanggil socket store saat 'notification:new' tiba.
  const receive = (n: NotificationDTO) => {
    if (items.value.some((x) => x.id === n.id)) return; // anti-duplikat (fetch & socket balapan)
    items.value.unshift(n);
    if (items.value.length > 50) items.value = items.value.slice(0, 50);
    if (!n.isRead) unread.value++;
  };

  const markRead = async (id: number) => {
    const n = items.value.find((x) => x.id === id);
    if (!n || n.isRead) return;
    n.isRead = true;
    unread.value = Math.max(0, unread.value - 1);
    try {
      await notificationsService.markRead(id);
    } catch {
      /* optimistik — abaikan kegagalan jaringan */
    }
  };

  const markAllRead = async () => {
    if (!unread.value) return;
    items.value.forEach((n) => (n.isRead = true));
    unread.value = 0;
    try {
      await notificationsService.markAllRead();
    } catch {
      /* abaikan */
    }
  };

  const reset = () => {
    items.value = [];
    unread.value = 0;
  };

  return { items, unread, loading, fetch, receive, markRead, markAllRead, reset };
});
