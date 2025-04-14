const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { auth, authorize } = require('../middlewares/auth');
const { storeValidationRules, validate } = require('../middlewares/validation');

// Public routes
router.get('/', storeController.getStores);
router.get('/:id/ratings', storeController.getStoreRatings);

// Protected routes
router.use(auth);

// Admin routes
router.get('/stats', authorize('admin'), storeController.getStats);

// Store owner routes
router.get('/my-store', authorize('storeOwner'), storeController.getMyStore);

// Admin and store owner routes
router.post('/', authorize('admin', 'storeOwner'), storeValidationRules, validate, storeController.createStore);
router.put('/:id', authorize('admin', 'storeOwner'), storeValidationRules, validate, storeController.updateStore);
router.delete('/:id', authorize('admin', 'storeOwner'), storeController.deleteStore);

module.exports = router;
