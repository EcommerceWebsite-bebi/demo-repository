import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id: orderId } = await params;
    const isAdmin = user.role_name === 'ADMIN';

    const order = await query.get<any>(`
      SELECT o.*, u.username, u.email, os.name as status_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_status os ON o.status_id = os.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (!isAdmin && order.user_id !== user.id) {
      return forbiddenResponse('Not authorized to view this order');
    }

    const items = await query.all(`
      SELECT oi.*, p.name as product_name, p.image as product_image
      FROM order_items oi
      INNER JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items
      }
    });
  } catch (error: any) {
    console.error('Get order details error:', error);
    return NextResponse.json({ success: false, message: 'Server error retrieving order details' }, { status: 500 });
  }
}
