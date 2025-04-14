const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { auth, authorize } = require('../middlewares/auth');
const { ratingValidationRules, validate } = require('../middlewares/validation');

// All routes require authentication
router.use(auth);

// User routes
router.post('/', authorize('user'), ratingValidationRules, validate, ratingController.submitRating);
router.get('/my-ratings', authorize('user'), ratingController.getUserRatings);

// Store owner routes
router.get('/store-owner', authorize('storeOwner'), ratingController.getStoreOwnerRatings);

module.exports = router;
