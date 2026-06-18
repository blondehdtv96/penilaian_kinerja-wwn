import { Router } from 'express';
import { BlockchainController } from './blockchain.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const controller = new BlockchainController();

router.use(authMiddleware);
router.get('/status', controller.status);
router.get('/hashes', checkRole(['Section Manager', 'Foreman']), controller.getHashes);
router.post('/store', checkRole(['Section Manager', 'Foreman']), controller.storeHash);
router.get('/verify/:id', checkRole(['Section Manager', 'Foreman']), controller.verify);

export default router;
