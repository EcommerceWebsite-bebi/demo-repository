import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const { code, total_price } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, message: 'Vui lòng cung cấp mã giảm giá.' }, { status: 400 });
    }

    if (total_price === undefined || total_price < 0) {
      return NextResponse.json({ success: false, message: 'Vui lòng cung cấp giá trị đơn hàng hợp lệ.' }, { status: 400 });
    }

    const formattedCode = code.toUpperCase().trim();

    const coupon = await query.get<any>('SELECT * FROM coupons WHERE code = ?', [formattedCode]);
    
    if (!coupon) {
      return NextResponse.json({ success: false, message: 'Mã giảm giá không hợp lệ.' }, { status: 400 });
    }

    if (coupon.is_active === 0) {
      return NextResponse.json({ success: false, message: 'Mã giảm giá này đã bị tạm khóa.' }, { status: 400 });
    }

    // Check expiration date
    if (coupon.end_date) {
      const expiry = new Date(coupon.end_date);
      const now = new Date();
      if (expiry < now) {
        return NextResponse.json({ success: false, message: 'Mã giảm giá này đã hết hạn sử dụng.' }, { status: 400 });
      }
    }

    // Check usage limits
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ success: false, message: 'Mã giảm giá này đã hết lượt sử dụng.' }, { status: 400 });
    }

    // Check min order value
    if (total_price < coupon.min_order_value) {
      return NextResponse.json({ 
        success: false, 
        message: `Đơn hàng tối thiểu phải đạt ${coupon.min_order_value.toLocaleString('vi-VN')} đ để áp dụng mã này.` 
      }, { status: 400 });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = total_price * (coupon.discount_value / 100);
      if (coupon.max_discount !== null && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = coupon.discount_value;
    }

    // Discount cannot exceed the total order price
    if (discountAmount > total_price) {
      discountAmount = total_price;
    }

    return NextResponse.json({
      success: true,
      message: 'Mã giảm giá hợp lệ!',
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount
      }
    });

  } catch (error: any) {
    console.error('Validate coupon error:', error);
    return NextResponse.json({ success: false, message: 'Server error validating coupon' }, { status: 500 });
  }
}
