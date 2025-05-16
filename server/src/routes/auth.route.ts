import express from 'express';
import AuthController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// Authentication routes
router.post('/login', AuthController.login); // Login route
router.post('/register', authenticate, AuthController.register); // Register route (admin only)
router.get('/me', authenticate, AuthController.getCurrentUser); // Get current user profile
router.put('/change-password', authenticate, AuthController.changePassword); // Change password

// User management routes
router.get('/users', authenticate, AuthController.getAllUsers); // Get all users

// Role management routes
router.post('/roles', authenticate, AuthController.createRole); // Create a new role
router.get('/roles', authenticate, AuthController.getRoles); // Get all roles
router.get('/roles/:id', authenticate, AuthController.getRoleById); // Get a specific role
router.put('/roles/:id', authenticate, AuthController.updateRole); // Update a role
router.delete('/roles/:id', authenticate, AuthController.deleteRole); // Delete a role
router.get('/permissions/:roleName', authenticate, AuthController.getPermissionsByRole);

// Permission management routes
router.get('/permissions', authenticate, AuthController.getAllPermissions); // Get all permissions
router.post('/sync-page-permissions', authenticate, AuthController.syncPagePermissions); // Sync page permissions

export default router;