const express = require('express');
const router = express.Router();
const {
  getCategories,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', protect, authorize('ADMIN'), createProduct);
router.put('/:id', protect, authorize('ADMIN'), updateProduct);
router.delete('/:id', protect, authorize('ADMIN'), deleteProduct);

module.exports = router;
