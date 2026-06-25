import { PrismaClient } from '@prisma/client';
import { getIo } from '../socket/io';

const prisma = new PrismaClient();

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationInput {
  type?: NotificationType;
  category: string; // voo | misconduct | counseling | kartu_kuning | surat_peringatan
  title: string;
  body?: string;
  entityType?: string;
  entityId?: number;
  link?: string; // route frontend yang dibuka saat notifikasi diklik
  data?: Record<string, unknown>;
}

export class NotificationService {
  /** Tulis 1 baris notifikasi untuk satu user lalu dorong via socket ke room-nya. */
  async notifyUser(userId: number, input: NotificationInput) {
    const notif = await prisma.notification.create({
      data: {
        userId,
        type: input.type ?? 'info',
        category: input.category,
        title: input.title,
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
        link: input.link,
        data: JSON.stringify(input.data ?? {}),
      },
    });
    this.emit(`user:${userId}`, notif);
    return notif;
  }

  /** Fan-out ke semua user aktif yang memegang sebuah peran. */
  async notifyRole(roleName: string, input: NotificationInput) {
    const users = await prisma.user.findMany({
      where: { role: { name: roleName }, isActive: true },
      select: { id: true },
    });
    await Promise.all(users.map((u) => this.notifyUser(u.id, input)));
  }

  /** Resolve operator → user, lalu kirim. */
  async notifyOperator(operatorId: number, input: NotificationInput) {
    const op = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: { userId: true },
    });
    if (op) await this.notifyUser(op.userId, input);
  }

  async list(userId: number, limit = 30) {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items: items.map((n) => this.serialize(n)), unread };
  }

  async unreadCount(userId: number) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  /** Hanya pemilik yang boleh menandai dibaca (guard userId). */
  async markRead(userId: number, id: number) {
    await prisma.notification.updateMany({
      where: { id, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return this.unreadCount(userId);
  }

  async markAllRead(userId: number) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return 0;
  }

  private emit(room: string, notif: { data: string } & Record<string, unknown>) {
    try {
      getIo().to(room).emit('notification:new', this.serialize(notif));
    } catch {
      // Socket belum siap — baris DB tetap tersimpan, client mengambilnya saat fetch berikutnya.
    }
  }

  private serialize(n: { data: string } & Record<string, unknown>) {
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(n.data);
    } catch {
      parsed = {};
    }
    return { ...n, data: parsed };
  }
}
