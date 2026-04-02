import { Router } from 'express';
import { createMachine, getMachines, updateMachine, deleteMachine } from '../controllers/machine.controller';

const router = Router();

router.post('/', createMachine);
router.get('/', getMachines);
router.put('/:id', updateMachine);
router.delete('/:id', deleteMachine);

export default router;
