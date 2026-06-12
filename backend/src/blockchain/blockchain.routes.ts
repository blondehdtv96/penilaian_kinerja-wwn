import { Router } from 'express';
import { BlockchainController } from './blockchain.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';

const router = Router();
const blockchainController = new BlockchainController();

router.use(authMiddleware);

router.get('/', checkRole(['Super Admin', 'Manager']), blockchainController.getBlockchain);
router.get('/verify', checkRole(['Super Admin', 'Manager']), blockchainController.verifyChain);
router.get('/:blockIndex', checkRole(['Super Admin', 'Manager']), blockchainController.getBlock);
router.post('/genesis', checkRole(['Super Admin']), blockchainController.initializeGenesis);

export default router;
