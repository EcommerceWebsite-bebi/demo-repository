const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { orderUpload } = require('../middleware/upload');

// Create order accepts file upload for custom_design_image if custom designs are uploaded directly
router.post('/', protect, orderUpload, createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('ADMIN'), updateOrderStatus);

module.exports = router;
