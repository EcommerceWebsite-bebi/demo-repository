import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { completeDailyTask } from '@/lib/daily-rewards';

export async function POST(req: Request, context: RouteContext<'/api/daily/tasks/[code]/complete'>) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse('Vui lòng đăng nhập để nhận thưởng');
    const { code } = await context.params;
    const result = await completeDailyTask(user.id, code);
    if (!result.ok) {
      const message = result.reason === 'not_started'
        ? 'Bạn chưa bắt đầu nhiệm vụ này'
        : `Cần thực hiện thêm ${result.remainingSeconds} giây`;
      return NextResponse.json({ success: false, message, ...result }, { status: 409 });
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Complete daily task error:', error);
    return NextResponse.json({ success: false, message: 'Không thể hoàn thành nhiệm vụ' }, { status: 500 });
  }
}
