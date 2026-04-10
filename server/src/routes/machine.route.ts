import { Router } from 'express';
import { createMachine, getMachines, getMachinesWithOutput, updateMachine, deleteMachine } from '../controllers/machine.controller';

const router = Router();

router.post('/', createMachine);
router.get('/', getMachines);
router.get('/with-output', getMachinesWithOutput);
router.put('/:id', updateMachine);
router.delete('/:id', deleteMachine);

export default router;
