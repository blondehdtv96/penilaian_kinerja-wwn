import { Router } from 'express';
import { MisconductController } from './misconduct.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const controller = new MisconductController();

router.use(authMiddleware);

// Misconduct
router.post('/misconduct', checkRole(['Foreman', 'Section Manager']), controller.createMisconduct);
router.get('/misconduct', controller.getAllMisconducts);

// Counseling
router.post('/counseling', checkRole(['Foreman']), controller.createCounseling);
router.get('/counseling', controller.getAllCounselings);

// Kartu Kuning
router.post('/kartu-kuning', checkRole(['Foreman', 'Section Manager']), controller.createKartuKuning);
router.get('/kartu-kuning', controller.getAllKartuKuning);

// Surat Peringatan
router.post('/surat-peringatan', checkRole(['Foreman', 'Section Manager']), controller.createSuratPeringatan);
router.get('/surat-peringatan', controller.getAllSuratPeringatan);

export default router;
