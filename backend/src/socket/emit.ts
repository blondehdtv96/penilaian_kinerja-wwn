import { getIo } from './io';

/**
 * Emit event domain (efemeral, tanpa persistensi) ke sejumlah room sekaligus.
 * Dipakai untuk sinyal "data berubah" agar halaman terkait melakukan refetch
 * secara real-time. Berbeda dengan notifikasi inbox yang tersimpan di DB.
 */
export const emitToRooms = (rooms: string[], event: string, payload: unknown) => {
  try {
    const io = getIo();
    for (const room of rooms) io.to(room).emit(event, payload);
  } catch {
    // Socket belum siap — event domain efemeral, aman untuk dilewati.
  }
};
