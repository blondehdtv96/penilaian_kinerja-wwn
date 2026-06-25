import { onMounted, onUnmounted } from 'vue';
import { useSocketStore } from '@/stores/socket';

/**
 * Jalankan `handler` saat salah satu event domain socket tiba (mis. 'voo:changed',
 * 'record:changed'). Throttle ringan agar burst beberapa event (mis. fan-out ke
 * banyak penerima) tidak memicu refetch beruntun.
 *
 * Listener didaftarkan lewat socket store (yang menyimpan registry), jadi tetap
 * terpasang walau socket baru tersambung setelah komponen ini mount, dan otomatis
 * dilepas saat unmount.
 */
export function useRealtime(
  events: string | string[],
  handler: () => void,
  opts: { throttleMs?: number } = {}
) {
  const socket = useSocketStore();
  const list = Array.isArray(events) ? events : [events];
  const throttleMs = opts.throttleMs ?? 400;

  let timer: ReturnType<typeof setTimeout> | null = null;
  const run = () => {
    if (timer) return; // sudah ada refetch terjadwal dalam jendela throttle
    timer = setTimeout(() => {
      timer = null;
      handler();
    }, throttleMs);
  };

  onMounted(() => list.forEach((e) => socket.on(e, run)));
  onUnmounted(() => {
    list.forEach((e) => socket.off(e, run));
    if (timer) clearTimeout(timer);
  });
}
