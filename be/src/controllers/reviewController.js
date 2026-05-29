const { query } = require('../config/db');

// @desc    Leave a product review
// @route   POST /api/reviews
// @access  Private
async function createReview(req, res) {
  const userId = req.user.id;
  const { product_id, rating, comment } = req.body;

  if (!product_id || rating === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide product_id and rating' });
  }

  const rate = parseInt(rating, 10);
  if (isNaN(rate) || rate < 1 || rate > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
  }

  try {
    // Check if product exists
    const product = await query.get('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await query.get(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existingReview) {
      // Update review
      await query.run(
        'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
        [rate, comment || null, existingReview.id]
      );
      
      const updatedReview = await query.get('SELECT * FROM reviews WHERE id = ?', [existingReview.id]);
      return res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        review: updatedReview
      });
    }

    // Insert review
    const result = await query.run(`
      INSERT INTO reviews (user_id, product_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `, [userId, product_id, rate, comment || null]);

    const newReview = await query.get('SELECT * FROM reviews WHERE id = ?', [result.id]);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: newReview
    });

  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting review' });
  }
}

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
async function getProductReviews(req, res) {
  const productId = req.params.productId;

  try {
    const reviews = await query.all(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.username, u.avatar
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving product reviews' });
  }
}

module.exports = {
  createReview,
  getProductReviews
};
