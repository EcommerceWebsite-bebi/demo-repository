import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const reviews = await query.all<any>(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.username, u.avatar
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);

    return NextResponse.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error: any) {
    console.error('Get product reviews error:', error);
    return NextResponse.json({ success: false, message: 'Server error retrieving product reviews' }, { status: 500 });
  }
}
