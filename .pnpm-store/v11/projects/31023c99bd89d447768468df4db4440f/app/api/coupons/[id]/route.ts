import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { query } from '@/lib/db';

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

    const { id } = await params;

    const coupon = await query.get<{ id: number }>('SELECT id FROM coupons WHERE id = ?', [id]);
    if (!coupon) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy mã giảm giá.' }, { status: 404 });
    }

    await query.run('DELETE FROM coupons WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Xóa mã giảm giá thành công'
    });
  } catch (error: any) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ success: false, message: 'Server error deleting coupon' }, { status: 500 });
  }
}
