const { query } = require('../config/db');
const PDFDocument = require('pdfkit');
const cloudinary = require('cloudinary').v2;

async function createDesignPDF(item, order, user) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header Brand
      doc.fillColor('#1E293B');
      doc.fontSize(20).font('Helvetica-Bold').text('MOUSEEE CUSTOM SHIRT SPECIFICATION', { align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor('#64748B').text('Custom Merchandise Production Sheet', { align: 'center' });
      doc.moveDown(1.5);

      // Info Table Section
      const startY = doc.y;
      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, startY).lineTo(555, startY).stroke();
      doc.moveDown(1);

      // Customer Section (Left)
      doc.fillColor('#1E293B');
      doc.fontSize(12).font('Helvetica-Bold').text('Customer Details', 40, startY + 15);
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica-Bold').text('Name: ', { continued: true }).font('Helvetica').fillColor('#334155').text(user.username || 'N/A');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Email: ', { continued: true }).font('Helvetica').fillColor('#334155').text(user.email || 'N/A');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Phone: ', { continued: true }).font('Helvetica').fillColor('#334155').text(order.phone || 'N/A');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Address: ', { continued: true }).font('Helvetica').fillColor('#334155').text(order.shipping_address || 'N/A');
      if (order.note) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Note: ', { continued: true }).font('Helvetica').fillColor('#334155').text(order.note);
      }

      // Product Section (Right)
      doc.fillColor('#1E293B');
      doc.fontSize(12).font('Helvetica-Bold').text('Garment Specs', 300, startY + 15);
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica-Bold').text('Product: ', 300).font('Helvetica').fillColor('#334155').text(item.product_name || 'Custom Oversize T-Shirt', 360);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Size: ', 300).font('Helvetica').fillColor('#334155').text(item.size || 'M', 360);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Color: ', 300).font('Helvetica').fillColor('#334155').text(item.color || 'Navy', 360);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Quantity: ', 300).font('Helvetica').fillColor('#334155').text(`x${item.quantity}`, 360);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Price: ', 300).font('Helvetica').fillColor('#334155').text(`${item.price.toLocaleString('vi-VN')} VND`, 360);

      doc.moveDown(3);
      const nextY = doc.y;
      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, nextY).lineTo(555, nextY).stroke();
      doc.moveDown(1.5);

      // Artwork Section
      doc.fillColor('#1E293B');
      doc.fontSize(14).font('Helvetica-Bold').text('Artwork Specifications', 40);
      doc.moveDown(1);

      if (item.custom_design_image) {
        const parts = item.custom_design_image.split('|');
        const isBase64 = parts[0].startsWith('data:image');

        if (isBase64) {
          doc.fontSize(10).fillColor('#475569').text('Canvas Studio Custom Designs:', 40);
          doc.moveDown(1);

          let imageY = doc.y;

          // Front image
          try {
            const frontBase64 = parts[0].split(';base64,').pop();
            const frontBuffer = Buffer.from(frontBase64, 'base64');
            doc.image(frontBuffer, 40, imageY, { width: 220, height: 330 });
            doc.fontSize(10).fillColor('#1E293B').font('Helvetica-Bold').text('MAT TRUOC (FRONT)', 40, imageY + 340, { width: 220, align: 'center' });
          } catch (err) {
            console.error('Front buffer render error:', err);
            doc.fontSize(10).fillColor('#EF4444').text('Failed to render Front Artwork image', 40, imageY);
          }

          // Back image
          if (parts[1]) {
            try {
              const backBase64 = parts[1].split(';base64,').pop();
              const backBuffer = Buffer.from(backBase64, 'base64');
              doc.image(backBuffer, 300, imageY, { width: 220, height: 330 });
              doc.fontSize(10).fillColor('#1E293B').font('Helvetica-Bold').text('MAT SAU (BACK)', 300, imageY + 340, { width: 220, align: 'center' });
            } catch (err) {
              console.error('Back buffer render error:', err);
              doc.fontSize(10).fillColor('#EF4444').text('Failed to render Back Artwork image', 300, imageY);
            }
          }
        } else {
          // AI generated specs
          doc.fontSize(10).fillColor('#475569').text('AI Generated Design Specifications:', 40);
          doc.moveDown(1);

          try {
            const urlObj = new URL(parts[0], 'http://localhost');
            const promptVal = urlObj.searchParams.get('prompt') || 'No prompt';
            const styleVal = urlObj.searchParams.get('style') || 'Minimalist';
            const sizeVal = urlObj.searchParams.get('size') || 'medium';

            // Draw prompt box
            const boxY = doc.y;
            doc.rect(40, boxY, 515, 120).fillColor('#F8FAFC').fillAndStroke('#E2E8F0');
            doc.fillColor('#1E293B');
            doc.fontSize(9).font('Helvetica-Bold').text('AI Prompt: ', 50, boxY + 15).font('Helvetica').text(promptVal, 50, boxY + 30, { width: 495 });
            doc.fontSize(9).font('Helvetica-Bold').text('AI Style: ', 50, boxY + 80).font('Helvetica').text(styleVal, 50, boxY + 95);
            doc.fontSize(9).font('Helvetica-Bold').text('AI Resolution Size: ', 200, boxY + 80).font('Helvetica').text(sizeVal, 200, boxY + 95);
          } catch (e) {
            doc.fontSize(10).font('Helvetica').text(`Design Source URL: ${parts[0]}`);
          }
        }
      } else {
        doc.fontSize(10).font('Helvetica').text('No design image provided.');
      }

      // End PDF creation
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function uploadPDFToCloudinary(pdfBuffer, fileName) {
  return new Promise((resolve, reject) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'tshirt_shop_order_pdfs',
        resource_type: 'raw',
        public_id: fileName,
        format: 'pdf'
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    stream.end(pdfBuffer);
  });
}

// @desc    Create a new order (Checkout cart OR buy direct)
// @route   POST /api/orders
// @access  Private
async function createOrder(req, res) {
  const userId = req.user.id;
  const { shipping_address, phone, note, items, coupon_code } = req.body;

  if (!shipping_address || !phone) {
    return res.status(400).json({ success: false, message: 'Please provide shipping_address and phone' });
  }

  try {
    const user = await query.get('SELECT username, email FROM users WHERE id = ?', [userId]);
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
          product_name: product.name,
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
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          size: item.size || null,
          color: item.color || null,
          custom_design_image: null // Can be set later or passed in cart
        });
      }
    }

    // Calculate total price
    const subtotal = orderItemsToCreate.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let totalPrice = subtotal;
    let discountAmount = 0;
    let appliedCouponCode = null;

    if (coupon_code) {
      const formattedCode = coupon_code.toUpperCase().trim();
      const coupon = await query.get('SELECT * FROM coupons WHERE code = ?', [formattedCode]);
      
      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá không hợp lệ.' });
      }
      if (coupon.is_active === 0) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá này đã bị tạm khóa.' });
      }
      if (coupon.end_date) {
        const expiry = new Date(coupon.end_date);
        const now = new Date();
        if (expiry < now) {
          return res.status(400).json({ success: false, message: 'Mã giảm giá này đã hết hạn sử dụng.' });
        }
      }
      if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá này đã hết lượt sử dụng.' });
      }
      if (subtotal < coupon.min_order_value) {
        return res.status(400).json({ 
          success: false, 
          message: `Đơn hàng tối thiểu phải đạt ${coupon.min_order_value.toLocaleString('vi-VN')} đ để áp dụng mã này.` 
        });
      }

      // Calculate discount amount
      if (coupon.discount_type === 'percentage') {
        discountAmount = subtotal * (coupon.discount_value / 100);
        if (coupon.max_discount !== null && discountAmount > coupon.max_discount) {
          discountAmount = coupon.max_discount;
        }
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = coupon.discount_value;
      }

      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }

      totalPrice = subtotal - discountAmount;
      appliedCouponCode = coupon.code;

      // Update coupon used count
      await query.run('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id]);
    }

    // Get PENDING status ID
    const pendingStatus = await query.get("SELECT id FROM order_status WHERE name = 'PENDING'");
    const statusId = pendingStatus ? pendingStatus.id : 1;

    // Create order
    const orderResult = await query.run(`
      INSERT INTO orders (user_id, total_price, status_id, shipping_address, phone, note, coupon_code, discount_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, totalPrice, statusId, shipping_address, phone, note || null, appliedCouponCode, discountAmount]);

    const orderId = orderResult.id;

    // Insert order items & update product stocks
    for (const item of orderItemsToCreate) {
      let pdfUrl = null;
      if (item.custom_design_image) {
        try {
          console.log('Generating design specification PDF for custom item...');
          const pdfBuffer = await createDesignPDF(item, { id: orderId, phone, shipping_address, note }, user);
          const fileName = `order_${orderId}_item_${item.product_id}_${Date.now()}`;
          pdfUrl = await uploadPDFToCloudinary(pdfBuffer, fileName);
          console.log('Design PDF uploaded successfully to Cloudinary:', pdfUrl);
        } catch (pdfErr) {
          console.error('Error generating/uploading PDF:', pdfErr);
        }
      }

      await query.run(`
        INSERT INTO order_items (order_id, product_id, quantity, price, size, color, custom_design_image, custom_design_pdf)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.quantity, item.price, item.size, item.color, item.custom_design_image, pdfUrl]);

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
