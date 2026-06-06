import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { query } from '@/lib/db';

async function getOrCreateCart(userId: number): Promise<number> {
  const cart = await query.get<{ id: number }>('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (!cart) {
    const result = await query.run('INSERT INTO carts (user_id) VALUES (?)', [userId]);
    return result.id;
  }
  return cart.id;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const { product_id, quantity, size, color } = await req.json();

    if (!product_id) {
      return NextResponse.json({ success: false, message: 'Please provide product_id' }, { status: 400 });
    }

    const qty = quantity ? parseInt(quantity, 10) : 1;
    if (qty <= 0) {
      return NextResponse.json({ success: false, message: 'Quantity must be greater than 0' }, { status: 400 });
    }

    const cartId = await getOrCreateCart(user.id);

    // Check if product exists
    const product = await query.get<any>('SELECT * FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Check if item with same product_id, size, and color already exists in user's cart
    const existingItem = await query.get<any>(`
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

    // Fetch updated cart items
    const items = await query.all<any>(`
      SELECT ci.id, ci.product_id, ci.quantity, ci.size, ci.color, p.name, p.price, p.image
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cartId]);

    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully',
      cart: {
        id: cartId,
        items,
        total_price: parseFloat(totalPrice.toFixed(2))
      }
    });
  } catch (error: any) {
    console.error('Add cart item error:', error);
    return NextResponse.json({ success: false, message: 'Server error adding item to cart' }, { status: 500 });
  }
}
