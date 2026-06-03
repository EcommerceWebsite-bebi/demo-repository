const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { uploadImage } = require('../controllers/uploadController');

// Route POST /api/upload
// Nhận file có key là 'image' và tải lên Cloudinary
router.post('/', upload.single('image'), uploadImage);

module.exports = router;
