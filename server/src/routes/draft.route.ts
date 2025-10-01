import express from 'express';
import { saveDraftBatch, getDraftBatch, deleteDraftBatch } from '../controllers/draft.controller';
import { authenticate } from '../middlewares/authMiddleware'; // Assuming you have auth middleware
import { getLatestDraftForUser } from '../controllers/draft.controller';

const router = express.Router();

// Protect routes with authentication
router.post('/batch', authenticate, saveDraftBatch);
router.get('/batch/:id', authenticate, getDraftBatch);

router.get('/batch-latest', authenticate, getLatestDraftForUser);

router.delete('/batch/:id', authenticate, deleteDraftBatch);

export default router;