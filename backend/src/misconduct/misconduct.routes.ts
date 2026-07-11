import { Router } from 'express';
import { MisconductController } from './misconduct.controller';
import { CatalogController } from './catalog.controller';
import { EscalationConfigController } from './escalation-config.controller';
import { DisciplinaryHistoryController } from './disciplinary-history.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const controller = new MisconductController();
const catalogController = new CatalogController();
const escalationConfigController = new EscalationConfigController();
const historyController = new DisciplinaryHistoryController();

router.use(authMiddleware);

// Violation catalog (R1). Manage: Section Manager only. Read: Foreman + Section Manager.
router.post('/violation-types', checkRole(['Section Manager']), catalogController.createViolationType);
router.patch('/violation-types/:id', checkRole(['Section Manager']), catalogController.updateViolationType);
router.patch(
  '/violation-types/:id/deactivate',
  checkRole(['Section Manager']),
  catalogController.deactivateViolationType,
);
router.get(
  '/violation-types',
  checkRole(['Foreman', 'Section Manager']),
  catalogController.listCatalog,
);

// Escalation config (R4.6, R4.7). Read: Foreman + Section Manager. Write: Section Manager only.
router.get(
  '/escalation-config',
  checkRole(['Foreman', 'Section Manager']),
  escalationConfigController.getActiveThresholds,
);
router.put(
  '/escalation-config',
  checkRole(['Section Manager']),
  escalationConfigController.setThresholds,
);

// Misconduct (R2). Reads additionally allow Staff Produksi (existing monitoring dashboard).
router.post('/misconduct', checkRole(['Foreman', 'Section Manager']), controller.createMisconduct);
router.get('/misconduct/my', checkRole(['Operator']), controller.getMyMisconducts);
router.get('/misconduct', checkRole(['Foreman', 'Section Manager', 'Staff Produksi']), controller.getAllMisconducts);

// Counseling (R3). Creation: Foreman + Section Manager. Acknowledgment: Section Manager only.
router.post('/counseling', checkRole(['Foreman', 'Section Manager']), controller.createCounseling);
router.get('/counseling', checkRole(['Foreman', 'Section Manager', 'Staff Produksi']), controller.getAllCounselings);
router.patch('/counseling/:id/acknowledge', checkRole(['Section Manager']), controller.acknowledgeCounseling);

// Kartu Kuning (R5)
router.post('/kartu-kuning', checkRole(['Foreman', 'Section Manager']), controller.createKartuKuning);
router.get('/kartu-kuning/my', checkRole(['Operator']), controller.getMyKartuKuning);
router.get('/kartu-kuning', checkRole(['Foreman', 'Section Manager', 'Staff Produksi']), controller.getAllKartuKuning);

// Surat Peringatan (R6)
router.post('/surat-peringatan', checkRole(['Foreman', 'Section Manager']), controller.createSuratPeringatan);
router.get('/surat-peringatan', checkRole(['Foreman', 'Section Manager', 'Staff Produksi']), controller.getAllSuratPeringatan);

// Integrated disciplinary history (R7)
router.get(
  '/disciplinary-history/my',
  checkRole(['Operator']),
  historyController.getMyHistory,
);
router.get(
  '/disciplinary-history/:operatorId',
  checkRole(['Foreman', 'Section Manager']),
  historyController.getHistory,
);

export default router;
