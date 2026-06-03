const express = require('express');
const router = express.Router();
const { 
  getCoupons, 
  getCouponsAdmin, 
  createCoupon, 
  deleteCoupon, 
  validateCoupon 
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getCoupons);

// Private/user routes
router.post('/validate', protect, validateCoupon);

// Admin-only routes
router.get('/admin', protect, authorize('ADMIN'), getCouponsAdmin);
router.post('/', protect, authorize('ADMIN'), createCoupon);
router.delete('/:id', protect, authorize('ADMIN'), deleteCoupon);

module.exports = router;
