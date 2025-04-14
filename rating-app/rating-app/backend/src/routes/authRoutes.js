const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { userValidationRules, passwordUpdateValidationRules, validate } = require('../middlewares/validation');
const { auth, authorize } = require('../middlewares/auth');

// Public routes
router.post('/signup', userValidationRules, validate, authController.signup);
router.post('/login', authController.login);

// Protected routes
router.get('/me', auth, authController.getCurrentUser);
router.put('/update-password', auth, passwordUpdateValidationRules, validate, authController.updatePassword);

// Admin only routes
router.get('/users', auth, authorize('admin'), authController.getUsers);
router.post('/users', auth, authorize('admin'), userValidationRules, validate, authController.createUser);
router.delete('/users/:id', auth, authorize('admin'), authController.deleteUser);

module.exports = router;
