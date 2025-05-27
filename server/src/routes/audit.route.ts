import express from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/authMiddleware';
import * as createController from '../controllers/Audit/create.controller';
import * as preparationController from '../controllers/Audit/preparation.controller';
import * as executionController from '../controllers/Audit/execution.controller';
import * as reportController from '../controllers/Audit/report.controller';
import * as followupController from '../controllers/Audit/followup.controller';
import { AuditDashboardController } from '../controllers/Audit/dashboard.controller';

const router = express.Router();

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB file size limit
  } 
});

// Apply authentication middleware to all routes
router.use(authenticate);

// ===== Dashboard Routes =====
router.get('/dashboard/overview', AuditDashboardController.getAuditOverview);
router.get('/dashboard/status-distribution', AuditDashboardController.getAuditStatusDistribution);
router.get('/dashboard/findings-distribution', AuditDashboardController.getFindingsDistribution);
router.get('/dashboard/recent-audits', AuditDashboardController.getRecentAudits);
router.get('/dashboard/upcoming-audits', AuditDashboardController.getUpcomingAudits);
router.get('/dashboard/overdue-actions', AuditDashboardController.getOverdueActions);
router.get('/dashboard/trends', AuditDashboardController.getAuditTrends);
router.get('/dashboard/department-stats', AuditDashboardController.getDepartmentAuditStats);
router.get('/dashboard/auditor-performance', AuditDashboardController.getAuditorPerformance);
router.get('/dashboard/critical-findings', AuditDashboardController.getCriticalFindings);
router.get('/dashboard/all', AuditDashboardController.getDashboardData);

// ===== Audit Base Routes =====

// Create and manage audits
router.post('/',createController.createAudit);
router.get('/', createController.getAudits);
router.get('/statistics', createController.getAuditStatistics);
router.get('/departments', createController.getAllDepartments);
router.post('/departments', createController.createDepartment);
router.get('/:id', createController.getAuditById);
router.put('/:id', createController.updateAudit);
router.delete('/:id', createController.deleteAudit);
router.patch('/:id/status', createController.changeAuditStatus);
router.delete('/:auditId/documents/:documentId', preparationController.deleteAuditDocument);

// ===== Preparation Phase Routes =====

// Notifications
router.post('/:auditId/notifications', preparationController.sendAuditNotifications);

// Document management with file upload middleware
router.post('/:auditId/documents', upload.single('file'), preparationController.uploadAuditDocument);
router.get('/:auditId/documents', preparationController.getAuditDocuments);

// Checklist management
router.post('/:auditId/checklist', preparationController.createPreAuditChecklist);
router.get('/:auditId/checklist', preparationController.getPreAuditChecklist);
router.patch('/checklist/:id', preparationController.updateChecklistItem);

// Previous audit actions
router.get('/:auditId/previous-actions', preparationController.getPreviousAuditActions);

// ===== Execution Phase Routes =====
router.post('/:auditId/execution/start', executionController.startExecutionPhase);
router.post('/:auditId/findings', upload.single('evidence'), executionController.createFinding);
router.get('/:auditId/findings', executionController.getAuditFindings);
router.get('/findings/:id', executionController.getFindingById);
router.put('/findings/:id', upload.single('evidence'), executionController.updateFinding);
router.post('/:auditId/inspection-checklist', executionController.createInspectionChecklist);
router.get('/:auditId/inspection-checklists', executionController.getInspectionChecklists);
router.post('/:auditId/execution/complete', executionController.completeExecutionPhase);
router.get('/inspection-items/:itemId', executionController.getInspectionItem);
router.put('/inspection-items/:itemId', upload.single('evidence'), executionController.updateInspectionItem);

// ===== Follow-up Phase Routes =====
router.post('/:auditId/report', reportController.generateAuditReport);
router.get('/:auditId/reports', reportController.getAuditReports);

// ===== Follow-up Phase Routes =====
router.post('/:auditId/corrective-actions', followupController.createCorrectiveAction);
router.get('/:auditId/corrective-actions', followupController.getCorrectiveActions);
router.put('/corrective-actions/:id', upload.single('evidence'), followupController.updateCorrectiveAction);
router.post('/:auditId/close', followupController.closeAudit);
router.get('/calendar/events', followupController.getAuditsForCalendar);

export default router;