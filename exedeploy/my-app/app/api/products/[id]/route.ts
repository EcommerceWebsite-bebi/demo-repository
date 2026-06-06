import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const product = await query.get<any>(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Get sizes and colors
    const sizes = await query.all<{ size_name: string }>('SELECT size_name FROM product_sizes WHERE product_id = ?', [productId]);
    const colors = await query.all<{ color_name: string }>('SELECT color_name FROM product_colors WHERE product_id = ?', [productId]);
    product.sizes = sizes.map(s => s.size_name);
    product.colors = colors.map(c => c.color_name);

    // Get reviews
    const reviews = await query.all<any>(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.username
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);

    product.reviews = reviews;

    return NextResponse.json({
      success: true,
      product
    });
  } catch (error: any) {
    console.error('Get product by ID error:', error);
    return NextResponse.json({ success: false, message: 'Server error retrieving product details' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role_name !== 'ADMIN') {
      return forbiddenResponse();
    }

    const { id: productId } = await params;
    const { name, description, price, stock, image, category_id, is_customizable, sizes, colors } = await req.json();

    const existingProduct = await query.get<any>('SELECT * FROM products WHERE id = ?', [productId]);
    if (!existingProduct) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
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
      await query.run('DELETE FROM product_sizes WHERE product_id = ?', [productId]);
      for (const size of sizes) {
        await query.run('INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)', [productId, size]);
      }
    }

    // Handle colors update if provided
    if (colors && Array.isArray(colors)) {
      await query.run('DELETE FROM product_colors WHERE product_id = ?', [productId]);
      for (const color of colors) {
        await query.run('INSERT INTO product_colors (product_id, color_name) VALUES (?, ?)', [productId, color]);
      }
    }

    // Retrieve updated product
    const product = await query.get<any>(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

    const updatedSizes = await query.all<{ size_name: string }>('SELECT size_name FROM product_sizes WHERE product_id = ?', [productId]);
    const updatedColors = await query.all<{ color_name: string }>('SELECT color_name FROM product_colors WHERE product_id = ?', [productId]);
    product.sizes = updatedSizes.map(s => s.size_name);
    product.colors = updatedColors.map(c => c.color_name);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ success: false, message: 'Server error updating product' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role_name !== 'ADMIN') {
      return forbiddenResponse();
    }

    const { id: productId } = await params;

    const product = await query.get<any>('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    await query.run('DELETE FROM products WHERE id = ?', [productId]);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ success: false, message: 'Server error deleting product' }, { status: 500 });
  }
}
