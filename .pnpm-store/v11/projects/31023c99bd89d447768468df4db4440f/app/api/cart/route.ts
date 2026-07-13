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

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const cartId = await getOrCreateCart(user.id);

    // Get cart items joined with products
    const items = await query.all<any>(`
      SELECT ci.id, ci.product_id, ci.quantity, ci.size, ci.color,
             p.name, p.price, p.discount_price, p.image, p.is_customizable
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cartId]);

    // Calculate total price of cart using active price
    const totalPrice = items.reduce((sum, item) => {
      const activePrice = (item.discount_price !== null && item.discount_price !== undefined && item.discount_price < item.price)
        ? item.discount_price
        : item.price;
      return sum + (activePrice * item.quantity);
    }, 0);

    // Format output price for cart items to be the discounted price if valid
    const formattedItems = items.map(item => {
      const activePrice = (item.discount_price !== null && item.discount_price !== undefined && item.discount_price < item.price)
        ? item.discount_price
        : item.price;
      return {
        ...item,
        price: activePrice,
        original_price: item.price
      };
    });

    return NextResponse.json({
      success: true,
      cart: {
        id: cartId,
        items: formattedItems,
        total_price: parseFloat(totalPrice.toFixed(2))
      }
    });
  } catch (error: any) {
    console.error('Get cart error:', error);
    return NextResponse.json({ success: false, message: 'Server error retrieving cart' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const cartId = await getOrCreateCart(user.id);
    await query.run('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error: any) {
    console.error('Clear cart error:', error);
    return NextResponse.json({ success: false, message: 'Server error clearing cart' }, { status: 500 });
  }
}
