import express from 'express';
import StandardController from '../controllers/Batch/standard.controller'
import { authenticate } from '../middlewares/authMiddleware';
import { checkPermission } from '../middlewares/checkPermisssion';


const router = express.Router();

// Standard routes
//router.post('/standards', authenticate,  StandardController.createStandard);
//router.get('/standards', authenticate, StandardController.getStandards);
//router.get('/standards/:id', authenticate, StandardController.getStandardById);
//router.put('/standards/:id', authenticate, checkPermission('UPDATE_STANDARD'), StandardController.updateStandard);
//router.delete('/standards/:id', authenticate, checkPermission('DELETE_STANDARD'), StandardController.deleteStandard);

// Standard category routes
router.post('/standards/categories', authenticate,  StandardController.createStandardCategory);
router.get('/categoriess', authenticate, StandardController.getStandardCategories);
router.put('/categories/:id', authenticate, StandardController.updateStandardCategory);
router.delete('/categories/:id', authenticate, StandardController.deleteStandardCategory);

router.post('/parameter', authenticate, StandardController.createStandardParameter);
router.get('/parameters', authenticate, StandardController.getStandardParameters);
router.put('/parameters/:id', authenticate, StandardController.updateStandardParameter);
router.delete('/parameters/:id', authenticate, StandardController.deleteStandardParameter);

// Unit of measurement routes
router.post('/units', authenticate, StandardController.createUnit);
router.get('/unit', authenticate, StandardController.getUnits);
router.put('/units/:id', authenticate, checkPermission('UPDATE_UNIT'), StandardController.updateUnit);
router.delete('/units/:id', authenticate, checkPermission('DELETE_UNIT'), StandardController.deleteUnit);

// Methodology routes
router.post('/methodologies', authenticate,  StandardController.createMethodology);
router.get('/methodologies', authenticate, StandardController.getMethodologies);
router.get('/methodologies/:id', authenticate, StandardController.getMethodologyById);
router.put('/methodologies/:id', authenticate, checkPermission('UPDATE_METHODOLOGY'), StandardController.updateMethodology);
router.delete('/methodologies/:id', authenticate, checkPermission('DELETE_METHODOLOGY'), StandardController.deleteMethodology);

export default router;