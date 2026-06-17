import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category_id = searchParams.get('category_id');
    const is_customizable = searchParams.get('is_customizable');

    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (is_customizable !== null) {
      sql += ' AND p.is_customizable = ?';
      params.push(is_customizable === 'true' || is_customizable === '1' ? 1 : 0);
    }

    sql += ' ORDER BY p.created_at DESC';

    const products = await query.all<any>(sql, params);

    // Fetch sizes, colors, and parse images for each product
    for (const product of products) {
      const sizes = await query.all<{ size_name: string }>('SELECT size_name FROM product_sizes WHERE product_id = ?', [product.id]);
      const colors = await query.all<{ color_name: string }>('SELECT color_name FROM product_colors WHERE product_id = ?', [product.id]);
      product.sizes = sizes.map(s => s.size_name);
      product.colors = colors.map(c => c.color_name);
      try {
        product.images = product.images ? JSON.parse(product.images) : (product.image ? [product.image] : []);
      } catch (e) {
        product.images = product.image ? [product.image] : [];
      }
    }

    return NextResponse.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    return NextResponse.json({ success: false, message: 'Server error retrieving products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role_name !== 'ADMIN') {
      return forbiddenResponse();
    }

    const { name, description, price, discount_price, stock, image, images, category_id, is_customizable, sizes, colors } = await req.json();

    if (!name || price === undefined) {
      return NextResponse.json(
        { success: false, message: 'Please provide product name and price' },
        { status: 400 }
      );
    }

    const customizable = is_customizable ? 1 : 0;
    const finalDiscountPrice = discount_price !== undefined && discount_price !== "" && discount_price !== null ? Number(discount_price) : null;
    const imagesJson = images && Array.isArray(images) ? JSON.stringify(images) : null;

    // Insert product
    const result = await query.run(`
      INSERT INTO products (name, description, price, discount_price, stock, image, images, category_id, is_customizable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description || null, price, finalDiscountPrice, stock || 0, image || null, imagesJson, category_id || null, customizable]);

    const productId = result.id;

    // Insert sizes if provided
    if (sizes && Array.isArray(sizes)) {
      for (const size of sizes) {
        await query.run('INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)', [productId, size]);
      }
    }

    // Insert colors if provided
    if (colors && Array.isArray(colors)) {
      for (const color of colors) {
        await query.run('INSERT INTO product_colors (product_id, color_name) VALUES (?, ?)', [productId, color]);
      }
    }

    // Retrieve created product
    const product = await query.get<any>(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

    if (product) {
      try {
        product.images = product.images ? JSON.parse(product.images) : (product.image ? [product.image] : []);
      } catch (e) {
        product.images = product.image ? [product.image] : [];
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: {
        ...product,
        sizes: sizes || [],
        colors: colors || [],
        images: images || (image ? [image] : [])
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ success: false, message: 'Server error creating product' }, { status: 500 });
  }
}
