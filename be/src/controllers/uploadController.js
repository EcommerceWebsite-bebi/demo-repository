const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/**
 * @desc    Tải ảnh thiết kế lên Cloudinary và trả về link CDN HTTPS
 * @route   POST /api/upload
 * @access  Public
 */
async function uploadImage(req, res) {
  try {
    // Cấu hình Cloudinary SDK sử dụng các biến môi trường
    // Di chuyển vào trong hàm để đảm bảo dotenv đã chạy xong khi request đến
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không tìm thấy tệp tin hoặc định dạng tệp tin không hợp lệ.' 
      });
    }

    // Upload tệp tin tạm từ local server lên Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'tshirt_shop_custom_designs',
    });

    // Dọn dẹp tệp tin tạm thời trên đĩa cứng server sau khi upload thành công
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Lỗi khi xóa tệp tin tạm thời trên server:', err.message);
      } else {
        console.log('Đã xóa tệp tin tạm thời thành công.');
      }
    });

    // Trả về kết quả link CDN HTTPS bảo mật
    return res.status(200).json({
      success: true,
      message: 'Tải ảnh lên Cloudinary thành công!',
      imageUrl: result.secure_url
    });

  } catch (error) {
    console.error('Lỗi khi upload ảnh lên Cloudinary:', error);

    // Dọn dẹp tệp tin tạm thời trên server nếu xảy ra lỗi giữa chừng
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Lỗi khi dọn dẹp tệp tin tạm thời sau khi lỗi:', err.message);
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ trong quá trình tải ảnh lên Cloudinary.',
      error: error.message
    });
  }
}

module.exports = {
  uploadImage
};
