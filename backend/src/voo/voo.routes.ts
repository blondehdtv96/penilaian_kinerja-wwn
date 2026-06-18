import { Router } from 'express';
import { VooController } from './voo.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
const controller = new VooController();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);

// Operator endpoints
router.post('/', checkRole(['Operator', 'Foreman']), upload.array('photos', 5), controller.create);
router.get('/my', checkRole(['Operator']), controller.getMySubmissions);
router.get('/:id', controller.getById);
router.get('/', controller.getAll);

// Foreman approval
router.post('/:id/approve-foreman', checkRole(['Foreman']), controller.approveForeman);

// Section Manager approval
router.post('/:id/approve-manager', checkRole(['Section Manager']), controller.approveManager);

export default router;
