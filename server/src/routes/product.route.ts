import express from 'express';
import ProductController from '../controllers/Batch/product.controller';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// Product routes
router.post('/', authenticate, ProductController.createProduct);
router.get('/', authenticate, ProductController.getProducts); // Get all products with filtering

export default router;