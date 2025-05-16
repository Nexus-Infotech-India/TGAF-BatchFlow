import express from 'express';
import BatchController from '../controllers/Batch/batch.controller';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// Batch routes
router.post('/batches', authenticate, BatchController.createBatch); // Create a new batch
router.get('/batches', authenticate, BatchController.getBatches); // Get all batches with filtering
//router.get('/batches/:id', authenticate, BatchController.getBatchById); // Get batch details by ID
router.put('/batches/:id', authenticate, BatchController.updateBatch); // Update a batch (if in DRAFT)
router.put('/batches/:id/submit', authenticate, BatchController.submitBatch); // Submit a batch for review
router.put('/batches/:id/approve', authenticate, BatchController.approveBatch); // Approve a batch
router.put('/batches/:id/reject', authenticate, BatchController.rejectBatch); // Reject a batch
router.get('/batches/export', authenticate, BatchController.exportToExcel); // Export batches to Excel
router.get('/logs', authenticate, BatchController.getActivityLogs); // Get activity logs

// Add the Certificate of Analysis route
router.get('/batches/:id/certificate', authenticate, BatchController.generateCertificateOfAnalysis); // Generate Certificate of Analysis

export default router;