import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { query } from '@/lib/db';

async function getOrCreateCart(userId: number): Promise<number> {
  const cart = await query.get<{ id: number }>('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (!cart) {
    const result = await query.run('INSERT INTO carts (user_id) VALUES (?)', [userId]);
    return result.id;
  }
  return cart.id;
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

    const { id: itemId } = await params;
    const { quantity } = await req.json();

    if (quantity === undefined) {
      return NextResponse.json({ success: false, message: 'Please provide quantity' }, { status: 400 });
    }

    const qty = parseInt(quantity, 10);
    const cartId = await getOrCreateCart(user.id);

    // Verify cart item belongs to user's cart
    const item = await query.get<any>('SELECT id, cart_id FROM cart_items WHERE id = ?', [itemId]);
    if (!item) {
      return NextResponse.json({ success: false, message: 'Cart item not found' }, { status: 404 });
    }

    if (item.cart_id !== cartId) {
      return forbiddenResponse('Not authorized to update this cart item');
    }

    if (qty <= 0) {
      await query.run('DELETE FROM cart_items WHERE id = ?', [itemId]);
    } else {
      await query.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [qty, itemId]);
    }

    // Fetch updated cart items
    const items = await query.all<any>(`
      SELECT ci.id, ci.product_id, ci.quantity, ci.size, ci.color, p.name, p.price, p.discount_price, p.image
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
      message: 'Cart updated successfully',
      cart: {
        id: cartId,
        items: formattedItems,
        total_price: parseFloat(totalPrice.toFixed(2))
      }
    });
  } catch (error: any) {
    console.error('Update cart item error:', error);
    return NextResponse.json({ success: false, message: 'Server error updating cart item' }, { status: 500 });
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

    const { id: itemId } = await params;
    const cartId = await getOrCreateCart(user.id);

    const item = await query.get<any>('SELECT id, cart_id FROM cart_items WHERE id = ?', [itemId]);
    if (!item) {
      return NextResponse.json({ success: false, message: 'Cart item not found' }, { status: 404 });
    }

    if (item.cart_id !== cartId) {
      return forbiddenResponse('Not authorized to delete this cart item');
    }

    await query.run('DELETE FROM cart_items WHERE id = ?', [itemId]);

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error: any) {
    console.error('Remove cart item error:', error);
    return NextResponse.json({ success: false, message: 'Server error removing item from cart' }, { status: 500 });
  }
}
