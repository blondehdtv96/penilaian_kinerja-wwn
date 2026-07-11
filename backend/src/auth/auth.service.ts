import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class AuthService {
  async login(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true, operator: true }
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials or account inactive');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Invalid credentials');

    const permissions: string[] = JSON.parse(user.role.permissions || '[]');

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role.name,
        permissions
      },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    const { password: _, ...safeUser } = user;
    return {
      token,
      user: {
        ...safeUser,
        role: user.role.name,
        permissions
      }
    };
  }

  async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, operator: true }
    });

    if (!user) throw new Error('User not found');

    const permissions: string[] = JSON.parse(user.role.permissions || '[]');
    const { password: _, ...safeUser } = user;

    return { ...safeUser, role: user.role.name, permissions };
  }

  /**
   * Update profil sendiri — tersedia untuk SEMUA role (user yang sedang login).
   * Bisa memperbarui: email, password, dan NIK secara dinamis.
   * currentPassword wajib hanya bila user mengubah password.
   */
  async updateProfile(
    userId: number,
    data: { email?: string; nik?: string | null; password?: string; currentPassword?: string }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const updateData: any = {};

    // Email
    if (data.email !== undefined && data.email !== user.email) {
      const email = String(data.email).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Format email tidak valid');
      }
      const exists = await prisma.user.findFirst({
        where: { email, id: { not: userId } }
      });
      if (exists) throw new Error('Email sudah digunakan pengguna lain');
      updateData.email = email;
    }

    // NIK (dinamis, boleh dikosongkan)
    if (data.nik !== undefined) {
      const nik = data.nik === null ? null : String(data.nik).trim() || null;
      if (nik && nik !== user.nik) {
        const exists = await prisma.user.findFirst({
          where: { nik, id: { not: userId } }
        });
        if (exists) throw new Error('NIK sudah digunakan pengguna lain');
      }
      updateData.nik = nik;
    }

    // Password — wajib verifikasi password lama
    if (data.password) {
      if (String(data.password).length < 6) {
        throw new Error('Password minimal 6 karakter');
      }
      const valid = await bcrypt.compare(data.currentPassword || '', user.password);
      if (!valid) throw new Error('Password saat ini salah');
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('Tidak ada perubahan untuk disimpan');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { role: true, operator: true }
    });

    const permissions: string[] = JSON.parse(updated.role.permissions || '[]');
    const { password: _, ...safeUser } = updated;

    return { ...safeUser, role: updated.role.name, permissions };
  }
}
