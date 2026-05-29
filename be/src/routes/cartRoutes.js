const express = require('express');
const router = express.Router();
const { getCart, addItemToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCart);
router.post('/items', protect, addItemToCart);
router.put('/items/:id', protect, updateCartItem);
router.delete('/items/:id', protect, removeCartItem);
router.delete('/clear', protect, clearCart);

module.exports = router;
