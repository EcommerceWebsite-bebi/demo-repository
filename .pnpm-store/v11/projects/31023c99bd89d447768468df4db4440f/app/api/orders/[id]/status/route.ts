import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { query } from '@/lib/db';

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

    const { id: orderId } = await params;
    const { status_id } = await req.json();

    if (!status_id) {
      return NextResponse.json({ success: false, message: 'Please provide status_id' }, { status: 400 });
    }

    // Check status validity
    const status = await query.get<{ name: string }>('SELECT name FROM order_status WHERE id = ?', [status_id]);
    if (!status) {
      return NextResponse.json({ success: false, message: 'Invalid status_id' }, { status: 400 });
    }

    // Check order
    const order = await query.get<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // If new status is CANCELLED (status_id = 5) and previous was not CANCELLED:
    // Restore product stock
    const cancelledStatus = await query.get<{ id: number }>("SELECT id FROM order_status WHERE name = 'CANCELLED'");
    const cancelledId = cancelledStatus ? cancelledStatus.id : 5;

    if (parseInt(status_id, 10) === cancelledId && order.status_id !== cancelledId) {
      const items = await query.all<{ product_id: number; quantity: number }>('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of items) {
        await query.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
      console.log(`Restored stock for cancelled order #${orderId}`);
    }

    // Update status
    await query.run('UPDATE orders SET status_id = ? WHERE id = ?', [status_id, orderId]);

    // Retrieve updated order details
    const updatedOrder = await query.get<any>(`
      SELECT o.*, os.name as status_name
      FROM orders o
      LEFT JOIN order_status os ON o.status_id = os.id
      WHERE o.id = ?
    `, [orderId]);

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status.name}`,
      order: updatedOrder
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    return NextResponse.json({ success: false, message: 'Server error updating order status' }, { status: 500 });
  }
}
