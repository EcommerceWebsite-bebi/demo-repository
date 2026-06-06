import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date().toISOString();
    const coupons = await query.all<any>(`
      SELECT id, code, discount_type, discount_value, min_order_value, max_discount, end_date
      FROM coupons
      WHERE is_active = 1
        AND (end_date IS NULL OR end_date > ?)
        AND (usage_limit IS NULL OR used_count < usage_limit)
      ORDER BY id DESC
    `, [now]);

    return NextResponse.json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error: any) {
    console.error('Get coupons error:', error);
    return NextResponse.json({ success: false, message: 'Server error retrieving coupons' }, { status: 500 });
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

    const { code, discount_type, discount_value, min_order_value, max_discount, end_date, usage_limit } = await req.json();

    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json(
        { success: false, message: 'Please provide code, discount_type and discount_value' },
        { status: 400 }
      );
    }

    const formattedCode = code.toUpperCase().trim();

    // Check if code exists
    const existing = await query.get<{ id: number }>('SELECT id FROM coupons WHERE code = ?', [formattedCode]);
    if (existing) {
      return NextResponse.json({ success: false, message: 'Mã giảm giá này đã tồn tại.' }, { status: 400 });
    }

    const result = await query.run(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, end_date, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      formattedCode,
      discount_type,
      discount_value,
      min_order_value || 0,
      max_discount || null,
      end_date || null,
      usage_limit || null
    ]);

    const newCoupon = await query.get('SELECT * FROM coupons WHERE id = ?', [result.id]);

    return NextResponse.json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
      coupon: newCoupon
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create coupon error:', error);
    return NextResponse.json({ success: false, message: 'Server error creating coupon' }, { status: 500 });
  }
}
