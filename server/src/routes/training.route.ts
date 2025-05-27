import express from 'express';
import { 
  createTraining, 
  submitTrainingFeedback,
  getAllTrainings,
  getTrainingById,
  updateTrainingStatus,
  updateTraining,
  deleteTraining,
  uploadSessionPhoto,
  createSessionPhoto,
  getSessionPhotos,
  deleteSessionPhoto,
  updateSessionPhotoCaption
} from '../controllers/Training/train.controller';

import {
  uploadTrainingDocuments,
  deleteTrainingDocument,
  getDocumentById,
  getTrainingDocuments,
  handleFileUpload,
  getAllDocuments,
  batchDeleteDocuments,
  updateDocumentMetadata,
  uploadSessionDocument,
  getSessionDocuments,
  deleteSessionDocument
} from '../controllers/Training/document.controller';

import {
  getTrainingParticipants,
  addTrainingParticipants,
  removeTrainingParticipant,
  updateParticipantStatus,
  resendParticipantInvite,
  handleInvitationResponse
} from '../controllers/Training/participant.controller';

import { authenticate } from '../middlewares/authMiddleware';
import { addTrainingSession, deleteTrainingSession, getSessionAttendance, getSessionById, getSessionFeedbackForms, getTrainingFeedbackForms, getTrainingSessions, recordAttendance, updateSessionStatus, updateTrainingSession, uploadFeedbackForm, uploadFeedbackFormFile } from '../controllers/Training/session.controller';
import { getCalendarStatistics, getDailyCalendar, getMonthlyCalendar, updateCalendarDescription } from '../controllers/Training/calender.controller';
import { getAttendanceStats, getDashboardStats, getFeedbackStats, getMonthlyTrainingStats, getParticipantEngagementStats, getTrainerStats, getTrainingSummaryStats } from '../controllers/Training/dashboard.controller';

const router = express.Router();

router.get('/respond',handleInvitationResponse);

// Apply authentication middleware to all routes
router.use(authenticate);

// Training routes
router.post('/', createTraining);
router.get('/get', getAllTrainings);
router.get('/:trainingId', getTrainingById);
router.post('/:trainingId/feedback', submitTrainingFeedback);
router.patch('/:trainingId/status', updateTrainingStatus);
router.put('/:trainingId', updateTraining);
router.delete('/:trainingId', deleteTraining);

// Document routes
router.get('/documents/all', getAllDocuments);
router.post('/documents/batch-delete', batchDeleteDocuments);
router.post('/:trainingId/documents', handleFileUpload, uploadTrainingDocuments);
router.get('/:trainingId/documents', getTrainingDocuments);
router.get('/documents/:documentId', getDocumentById);
router.patch('/documents/:documentId', updateDocumentMetadata);
router.delete('/documents/:documentId', deleteTrainingDocument);

// Participant routes
router.get('/:trainingId/participants', getTrainingParticipants);
router.post('/:trainingId/participants', addTrainingParticipants);
router.delete('/:trainingId/participants/:userId', removeTrainingParticipant);
router.patch('/:trainingId/participants/:userId/status', updateParticipantStatus);
router.post('/:trainingId/participants/:userId/resend-invite', resendParticipantInvite);

// Session routes
router.post('/:trainingId/sessions', addTrainingSession);
router.get('/:trainingId/sessions', getTrainingSessions);
router.get('/sessions/:sessionId', getSessionById);
router.patch('/sessions/:sessionId', updateTrainingSession);
router.delete('/sessions/:sessionId', deleteTrainingSession);
router.post('/sessions/:sessionId/attendance', recordAttendance);
router.get('/sessions/:sessionId/attendance', getSessionAttendance);
router.patch('/sessions/:sessionId/status', updateSessionStatus);
router.post('/sessions/:sessionId/documents', handleFileUpload, uploadSessionDocument);
router.get('/sessions/:sessionId/documents', getSessionDocuments);
router.delete('/documents/:documentId/session', deleteSessionDocument);

router.get('/calendar/monthly',getMonthlyCalendar);
router.get('/calendar/daily/:date',getDailyCalendar);
router.get('/calendar/statistics', getCalendarStatistics);
router.put('/calendar/:month/:year/description',updateCalendarDescription);

router.post('/sessions/:sessionId/photos', uploadSessionPhoto, createSessionPhoto);
router.get('/sessions/:sessionId/photos', getSessionPhotos);
//router.get('/trainings/:trainingId/photos', getTrainingSessionPhotosByTrainingId);
router.delete('/photos/:photoId', deleteSessionPhoto);
router.patch('/photos/:photoId', updateSessionPhotoCaption);

router.post('/sessions/:sessionId/participants/:participantId/feedback', uploadFeedbackFormFile, uploadFeedbackForm);
router.get('/sessions/:sessionId/feedback-forms', getSessionFeedbackForms);
router.get('/trainings/:trainingId/feedback-forms', getTrainingFeedbackForms);

// Dashboard statistics routes



export default router;