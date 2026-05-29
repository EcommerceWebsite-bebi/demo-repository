const { query } = require('../config/db');

// @desc    Create a new order (Checkout cart OR buy direct)
// @route   POST /api/orders
// @access  Private
async function createOrder(req, res) {
  const userId = req.user.id;
  const { shipping_address, phone, note, items } = req.body;

  if (!shipping_address || !phone) {
    return res.status(400).json({ success: false, message: 'Please provide shipping_address and phone' });
  }

  try {
    let orderItemsToCreate = [];
    let isCartCheckout = false;
    let cartId = null;

    if (items && Array.isArray(items) && items.length > 0) {
      // 1. Direct purchase flow
      for (const item of items) {
        const product = await query.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
        if (!product) {
          return res.status(404).json({ success: false, message: `Product with ID ${item.product_id} not found` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for product: ${product.name}` });
        }
        orderItemsToCreate.push({
          product_id: product.id,
          quantity: item.quantity,
          price: product.price,
          size: item.size || null,
          color: item.color || null,
          custom_design_image: item.custom_design_image || null
        });
      }
    } else {
      // 2. Cart checkout flow
      isCartCheckout = true;
      const cart = await query.get('SELECT id FROM carts WHERE user_id = ?', [userId]);
      if (!cart) {
        return res.status(400).json({ success: false, message: 'No cart found for this user' });
      }
      cartId = cart.id;

      const cartItems = await query.all(`
        SELECT ci.*, p.name, p.price, p.stock
        FROM cart_items ci
        INNER JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
      `, [cartId]);

      if (cartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Your cart is empty' });
      }

      for (const item of cartItems) {
        if (item.stock < item.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for product: ${item.name}` });
        }
        orderItemsToCreate.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          size: item.size || null,
          color: item.color || null,
          custom_design_image: null // Can be set later or passed in cart
        });
      }
    }

    // Calculate total price
    const totalPrice = orderItemsToCreate.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Get PENDING status ID
    const pendingStatus = await query.get("SELECT id FROM order_status WHERE name = 'PENDING'");
    const statusId = pendingStatus ? pendingStatus.id : 1;

    // Create order
    const orderResult = await query.run(`
      INSERT INTO orders (user_id, total_price, status_id, shipping_address, phone, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, totalPrice, statusId, shipping_address, phone, note || null]);

    const orderId = orderResult.id;

    // Insert order items & update product stocks
    for (const item of orderItemsToCreate) {
      await query.run(`
        INSERT INTO order_items (order_id, product_id, quantity, price, size, color, custom_design_image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.quantity, item.price, item.size, item.color, item.custom_design_image]);

      // Deduct stock
      await query.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    // Clear cart if it was a cart checkout
    if (isCartCheckout && cartId) {
      await query.run('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    }

    // Fetch complete created order
    const order = await query.get(`
      SELECT o.*, os.name as status_name
      FROM orders o
      LEFT JOIN order_status os ON o.status_id = os.id
      WHERE o.id = ?
    `, [orderId]);

    const itemsCreated = await query.all(`
      SELECT oi.*, p.name as product_name, p.image as product_image
      FROM order_items oi
      INNER JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: {
        ...order,
        items: itemsCreated
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ success: false, message: 'Server error placing order' });
  }
}

// @desc    Get orders (Admins see all, Users see their own)
// @route   GET /api/orders
// @access  Private
async function getOrders(req, res) {
  const userId = req.user.id;
  const isAdmin = req.user.role_name === 'ADMIN';

  try {
    let orders;
    if (isAdmin) {
      orders = await query.all(`
        SELECT o.*, u.username, u.email, os.name as status_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_status os ON o.status_id = os.id
        ORDER BY o.created_at DESC
      `);
    } else {
      orders = await query.all(`
        SELECT o.*, os.name as status_name
        FROM orders o
        LEFT JOIN order_status os ON o.status_id = os.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
      `, [userId]);
    }

    // Fetch items for each order
    for (const order of orders) {
      const items = await query.all(`
        SELECT oi.*, p.name as product_name, p.image as product_image
        FROM order_items oi
        INNER JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving orders' });
  }
}

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
async function getOrderById(req, res) {
  const userId = req.user.id;
  const isAdmin = req.user.role_name === 'ADMIN';
  const orderId = req.params.id;

  try {
    const order = await query.get(`
      SELECT o.*, u.username, u.email, os.name as status_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_status os ON o.status_id = os.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!isAdmin && order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    const items = await query.all(`
      SELECT oi.*, p.name as product_name, p.image as product_image
      FROM order_items oi
      INNER JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error('Get order details error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving order details' });
  }
}

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin only)
async function updateOrderStatus(req, res) {
  const { status_id } = req.body;
  const orderId = req.params.id;

  if (!status_id) {
    return res.status(400).json({ success: false, message: 'Please provide status_id' });
  }

  try {
    // Check status
    const status = await query.get('SELECT name FROM order_status WHERE id = ?', [status_id]);
    if (!status) {
      return res.status(400).json({ success: false, message: 'Invalid status_id' });
    }

    // Check order
    const order = await query.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If order is already cancelled or completed, restrict further modification unless needed
    // But we let admin update.
    // Specially: if new status is CANCELLED (status_id = 5) and previous status was not CANCELLED:
    // Restore product stock!
    const cancelledStatus = await query.get("SELECT id FROM order_status WHERE name = 'CANCELLED'");
    const cancelledId = cancelledStatus ? cancelledStatus.id : 5;

    if (status_id === cancelledId && order.status_id !== cancelledId) {
      const items = await query.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of items) {
        await query.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
      console.log(`Restored stock for cancelled order #${orderId}`);
    }

    // Update status
    await query.run('UPDATE orders SET status_id = ? WHERE id = ?', [status_id, orderId]);

    // Retrieve updated order details
    const updatedOrder = await query.get(`
      SELECT o.*, os.name as status_name
      FROM orders o
      LEFT JOIN order_status os ON o.status_id = os.id
      WHERE o.id = ?
    `, [orderId]);

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status.name}`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating order status' });
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
};
