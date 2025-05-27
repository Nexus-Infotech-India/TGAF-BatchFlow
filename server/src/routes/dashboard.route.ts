// In your routes file
import { Router } from 'express';
import DashboardController from '../controllers/Batch/dashboard.controller';
import { authenticate } from '../middlewares/authMiddleware';
import { getAttendanceStats, getDashboardStats, getFeedbackStats, getMonthlyTrainingStats, getParticipantEngagementStats, getTrainerStats, getTrainingSummaryStats } from '../controllers/Training/dashboard.controller';

const router = Router();

// Apply authentication middleware to all dashboard routes
router.use(authenticate);

// Dashboard endpoints
router.get('/overview', DashboardController.getOverviewStats);
router.get('/batch-trends', DashboardController.getBatchTrends);
router.get('/product-performance', DashboardController.getProductPerformance);
router.get('/user-activity', DashboardController.getUserActivity);
router.get('/quality-metrics', DashboardController.getQualityMetrics);
router.get('/monthly-summary', DashboardController.getMonthlyBatchSummary);
router.get('/standard-usage', DashboardController.getStandardUsageMetrics);

router.get('/summaryy', getTrainingSummaryStats);
router.get('/monthly', getMonthlyTrainingStats);
router.get('/attendance', getAttendanceStats);
router.get('/feedback', getFeedbackStats);
router.get('/trainers', getTrainerStats);
router.get('/engagement', getParticipantEngagementStats);
router.get('/', getDashboardStats);

export default router;