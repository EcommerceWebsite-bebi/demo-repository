const { query } = require('../config/db');

// @desc    Get all active coupons
// @route   GET /api/coupons
// @access  Public
async function getCoupons(req, res) {
  try {
    const now = new Date().toISOString();
    const coupons = await query.all(`
      SELECT id, code, discount_type, discount_value, min_order_value, max_discount, end_date
      FROM coupons
      WHERE is_active = 1
        AND (end_date IS NULL OR end_date > ?)
        AND (usage_limit IS NULL OR used_count < usage_limit)
      ORDER BY id DESC
    `, [now]);

    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving coupons' });
  }
}

// @desc    Get all coupons (Admin only)
// @route   GET /api/coupons/admin
// @access  Private (Admin only)
async function getCouponsAdmin(req, res) {
  try {
    const coupons = await query.all('SELECT * FROM coupons ORDER BY id DESC');
    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    console.error('Get coupons admin error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving admin coupons' });
  }
}

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private (Admin only)
async function createCoupon(req, res) {
  const { code, discount_type, discount_value, min_order_value, max_discount, end_date, usage_limit } = req.body;

  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide code, discount_type and discount_value' });
  }

  const formattedCode = code.toUpperCase().trim();

  try {
    // Check if code exists
    const existing = await query.get('SELECT id FROM coupons WHERE code = ?', [formattedCode]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá này đã tồn tại.' });
    }

    const result = await query.run(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, end_date, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      formattedCode,
      discount_type,
      discount_value,
      min_order_value || 0,
      max_discount || null,
      end_date || null,
      usage_limit || null
    ]);

    const newCoupon = await query.get('SELECT * FROM coupons WHERE id = ?', [result.id]);

    return res.status(201).json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
      coupon: newCoupon
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating coupon' });
  }
}

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin only)
async function deleteCoupon(req, res) {
  const { id } = req.params;

  try {
    const coupon = await query.get('SELECT id FROM coupons WHERE id = ?', [id]);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
    }

    await query.run('DELETE FROM coupons WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Xóa mã giảm giá thành công'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting coupon' });
  }
}

// @desc    Validate and calculate coupon discount
// @route   POST /api/coupons/validate
// @access  Private
async function validateCoupon(req, res) {
  const { code, total_price } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã giảm giá.' });
  }

  if (total_price === undefined || total_price < 0) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp giá trị đơn hàng hợp lệ.' });
  }

  const formattedCode = code.toUpperCase().trim();

  try {
    const coupon = await query.get('SELECT * FROM coupons WHERE code = ?', [formattedCode]);
    
    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá không hợp lệ.' });
    }

    if (coupon.is_active === 0) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá này đã bị tạm khóa.' });
    }

    // Check expiration date
    if (coupon.end_date) {
      const expiry = new Date(coupon.end_date);
      const now = new Date();
      if (expiry < now) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá này đã hết hạn sử dụng.' });
      }
    }

    // Check usage limits
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá này đã hết lượt sử dụng.' });
    }

    // Check min order value
    if (total_price < coupon.min_order_value) {
      return res.status(400).json({ 
        success: false, 
        message: `Đơn hàng tối thiểu phải đạt ${coupon.min_order_value.toLocaleString('vi-VN')} đ để áp dụng mã này.` 
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = total_price * (coupon.discount_value / 100);
      if (coupon.max_discount !== null && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = coupon.discount_value;
    }

    // Discount cannot exceed the total order price
    if (discountAmount > total_price) {
      discountAmount = total_price;
    }

    return res.status(200).json({
      success: true,
      message: 'Mã giảm giá hợp lệ!',
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount
      }
    });

  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ success: false, message: 'Server error validating coupon' });
  }
}

module.exports = {
  getCoupons,
  getCouponsAdmin,
  createCoupon,
  deleteCoupon,
  validateCoupon
};
