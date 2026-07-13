import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { performCheckIn } from '@/lib/daily-rewards';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse('Vui lòng đăng nhập để điểm danh');
    const result = await performCheckIn(user.id);
    return NextResponse.json({
      success: true,
      awarded: result.awarded,
      reward: result.reward,
      data: result.state,
      message: result.awarded ? 'Điểm danh thành công' : 'Bạn đã điểm danh hôm nay',
    });
  } catch (error) {
    console.error('Daily check-in error:', error);
    return NextResponse.json({ success: false, message: 'Không thể điểm danh lúc này' }, { status: 500 });
  }
}
