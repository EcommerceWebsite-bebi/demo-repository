const { query } = require('../config/db');

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
async function getCategories(req, res) {
  try {
    const categories = await query.all('SELECT * FROM categories ORDER BY name ASC');
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving categories' });
  }
}

// @desc    Get all products (with optional filtering)
// @route   GET /api/products
// @access  Public
async function getProducts(req, res) {
  const { category_id, is_customizable } = req.query;

  try {
    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (is_customizable !== undefined) {
      sql += ' AND p.is_customizable = ?';
      params.push(is_customizable === 'true' || is_customizable === '1' ? 1 : 0);
    }

    sql += ' ORDER BY p.created_at DESC';

    const products = await query.all(sql, params);

    // Fetch sizes and colors for each product
    for (const product of products) {
      const sizes = await query.all('SELECT size_name FROM product_sizes WHERE product_id = ?', [product.id]);
      const colors = await query.all('SELECT color_name FROM product_colors WHERE product_id = ?', [product.id]);
      product.sizes = sizes.map(s => s.size_name);
      product.colors = colors.map(c => c.color_name);
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving products' });
  }
}

// @desc    Get single product by ID (including reviews, sizes, and colors)
// @route   GET /api/products/:id
// @access  Public
async function getProductById(req, res) {
  const productId = req.params.id;

  try {
    const product = await query.get(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get sizes and colors
    const sizes = await query.all('SELECT size_name FROM product_sizes WHERE product_id = ?', [productId]);
    const colors = await query.all('SELECT color_name FROM product_colors WHERE product_id = ?', [productId]);
    product.sizes = sizes.map(s => s.size_name);
    product.colors = colors.map(c => c.color_name);

    // Get reviews
    const reviews = await query.all(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.username
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);

    product.reviews = reviews;

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving product details' });
  }
}

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
async function createProduct(req, res) {
  const { name, description, price, stock, image, category_id, is_customizable, sizes, colors } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide product name and price' });
  }

  try {
    const customizable = is_customizable ? 1 : 0;
    
    // Insert product
    const result = await query.run(`
      INSERT INTO products (name, description, price, stock, image, category_id, is_customizable)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, description || null, price, stock || 0, image || null, category_id || null, customizable]);

    const productId = result.id;

    // Insert sizes if provided (expect array of strings)
    if (sizes && Array.isArray(sizes)) {
      for (const size of sizes) {
        await query.run('INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)', [productId, size]);
      }
    }

    // Insert colors if provided (expect array of strings)
    if (colors && Array.isArray(colors)) {
      for (const color of colors) {
        await query.run('INSERT INTO product_colors (product_id, color_name) VALUES (?, ?)', [productId, color]);
      }
    }

    // Retrieve created product
    const product = await query.get('SELECT * FROM products WHERE id = ?', [productId]);
    
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: {
        ...product,
        sizes: sizes || [],
        colors: colors || []
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating product' });
  }
}

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
async function updateProduct(req, res) {
  const productId = req.params.id;
  const { name, description, price, stock, image, category_id, is_customizable, sizes, colors } = req.body;

  try {
    const existingProduct = await query.get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newName = name !== undefined ? name : existingProduct.name;
    const newDescription = description !== undefined ? description : existingProduct.description;
    const newPrice = price !== undefined ? price : existingProduct.price;
    const newStock = stock !== undefined ? stock : existingProduct.stock;
    const newImage = image !== undefined ? image : existingProduct.image;
    const newCategoryId = category_id !== undefined ? category_id : existingProduct.category_id;
    const newCustomizable = is_customizable !== undefined ? (is_customizable ? 1 : 0) : existingProduct.is_customizable;

    await query.run(`
      UPDATE products
      SET name = ?, description = ?, price = ?, stock = ?, image = ?, category_id = ?, is_customizable = ?
      WHERE id = ?
    `, [newName, newDescription, newPrice, newStock, newImage, newCategoryId, newCustomizable, productId]);

    // Handle sizes update if provided
    if (sizes && Array.isArray(sizes)) {
      // Clear old sizes
      await query.run('DELETE FROM product_sizes WHERE product_id = ?', [productId]);
      // Insert new sizes
      for (const size of sizes) {
        await query.run('INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)', [productId, size]);
      }
    }

    // Handle colors update if provided
    if (colors && Array.isArray(colors)) {
      // Clear old colors
      await query.run('DELETE FROM product_colors WHERE product_id = ?', [productId]);
      // Insert new colors
      for (const color of colors) {
        await query.run('INSERT INTO product_colors (product_id, color_name) VALUES (?, ?)', [productId, color]);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating product' });
  }
}

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
async function deleteProduct(req, res) {
  const productId = req.params.id;

  try {
    const product = await query.get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete product (ON DELETE CASCADE handles product_sizes, product_colors, reviews)
    await query.run('DELETE FROM products WHERE id = ?', [productId]);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting product' });
  }
}

module.exports = {
  getCategories,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
