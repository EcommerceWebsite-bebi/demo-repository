import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { getDailyState, setDailyReminder } from '@/lib/daily-rewards';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse('Vui lòng đăng nhập để xem điểm danh');
    return NextResponse.json({ success: true, data: await getDailyState(user.id) });
  } catch (error) {
    console.error('Get daily rewards error:', error);
    return NextResponse.json({ success: false, message: 'Không thể tải dữ liệu điểm danh' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse('Vui lòng đăng nhập để bật nhắc điểm danh');
    const body = await req.json();
    if (typeof body.reminderEnabled !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Trạng thái nhắc lịch không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      data: await setDailyReminder(user.id, body.reminderEnabled),
    });
  } catch (error) {
    console.error('Update daily reminder error:', error);
    return NextResponse.json({ success: false, message: 'Không thể cập nhật nhắc lịch' }, { status: 500 });
  }
}
