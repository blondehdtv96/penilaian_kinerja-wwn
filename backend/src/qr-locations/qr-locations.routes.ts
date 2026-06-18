import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', checkRole(['Section Manager', 'Foreman']), async (req, res) => {
  try {
    const locations = await prisma.qrLocation.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: locations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const location = await prisma.qrLocation.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!location) throw new Error('QR Location not found');
    res.json({ success: true, data: location });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
});

export default router;
