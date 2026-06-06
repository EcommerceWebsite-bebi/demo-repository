const express = require('express');
const router = express.Router();
const { updateProfile, getAllUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.put('/profile', protect, updateProfile);
router.get('/', protect, authorize('ADMIN'), getAllUsers);

module.exports = router;
