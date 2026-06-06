const { query } = require('../config/db');

// Helper to get or create cart for user
async function getOrCreateCart(userId) {
  let cart = await query.get('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (!cart) {
    const result = await query.run('INSERT INTO carts (user_id) VALUES (?)', [userId]);
    return result.id;
  }
  return cart.id;
}

// @desc    Get current user's cart and items
// @route   GET /api/cart
// @access  Private
async function getCart(req, res) {
  const userId = req.user.id;

  try {
    const cartId = await getOrCreateCart(userId);

    // Get cart items joined with products
    const items = await query.all(`
      SELECT ci.id, ci.product_id, ci.quantity, ci.size, ci.color,
             p.name, p.price, p.image, p.is_customizable
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cartId]);

    // Calculate total price of cart
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return res.status(200).json({
      success: true,
      cart: {
        id: cartId,
        items,
        total_price: parseFloat(totalPrice.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving cart' });
  }
}

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
async function addItemToCart(req, res) {
  const userId = req.user.id;
  const { product_id, quantity, size, color } = req.body;

  if (!product_id) {
    return res.status(400).json({ success: false, message: 'Please provide product_id' });
  }

  const qty = quantity ? parseInt(quantity, 10) : 1;
  if (qty <= 0) {
    return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
  }

  try {
    const cartId = await getOrCreateCart(userId);

    // Check if product exists
    const product = await query.get('SELECT * FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if item with same product_id, size, and color already exists in user's cart
    const existingItem = await query.get(`
      SELECT id, quantity FROM cart_items
      WHERE cart_id = ? AND product_id = ? AND (size = ? OR (size IS NULL AND ? IS NULL)) AND (color = ? OR (color IS NULL AND ? IS NULL))
    `, [cartId, product_id, size, size, color, color]);

    if (existingItem) {
      // Update quantity
      const newQty = existingItem.quantity + qty;
      await query.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existingItem.id]);
    } else {
      // Insert new item
      await query.run(`
        INSERT INTO cart_items (cart_id, product_id, quantity, size, color)
        VALUES (?, ?, ?, ?, ?)
      `, [cartId, product_id, qty, size || null, color || null]);
    }

    // Fetch updated cart
    const items = await query.all(`
      SELECT ci.id, ci.product_id, ci.quantity, ci.size, ci.color, p.name, p.price, p.image
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cartId]);

    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      cart: {
        id: cartId,
        items,
        total_price: parseFloat(totalPrice.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Add cart item error:', error);
    return res.status(500).json({ success: false, message: 'Server error adding item to cart' });
  }
}

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:id
// @access  Private
async function updateCartItem(req, res) {
  const userId = req.user.id;
  const itemId = req.params.id;
  const { quantity } = req.body;

  if (quantity === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide quantity' });
  }

  const qty = parseInt(quantity, 10);

  try {
    const cartId = await getOrCreateCart(userId);

    // Verify cart item belongs to user's cart
    const item = await query.get('SELECT id, cart_id FROM cart_items WHERE id = ?', [itemId]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    if (item.cart_id !== cartId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this cart item' });
    }

    if (qty <= 0) {
      // Remove item if quantity <= 0
      await query.run('DELETE FROM cart_items WHERE id = ?', [itemId]);
    } else {
      // Update quantity
      await query.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [qty, itemId]);
    }

    // Fetch updated cart items
    const items = await query.all(`
      SELECT ci.id, ci.product_id, ci.quantity, ci.size, ci.color, p.name, p.price, p.image
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cartId]);

    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      cart: {
        id: cartId,
        items,
        total_price: parseFloat(totalPrice.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating cart item' });
  }
}

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:id
// @access  Private
async function removeCartItem(req, res) {
  const userId = req.user.id;
  const itemId = req.params.id;

  try {
    const cartId = await getOrCreateCart(userId);

    const item = await query.get('SELECT id, cart_id FROM cart_items WHERE id = ?', [itemId]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    if (item.cart_id !== cartId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this cart item' });
    }

    await query.run('DELETE FROM cart_items WHERE id = ?', [itemId]);

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return res.status(500).json({ success: false, message: 'Server error removing item from cart' });
  }
}

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private
async function clearCart(req, res) {
  const userId = req.user.id;

  try {
    const cartId = await getOrCreateCart(userId);
    await query.run('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ success: false, message: 'Server error clearing cart' });
  }
}

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
