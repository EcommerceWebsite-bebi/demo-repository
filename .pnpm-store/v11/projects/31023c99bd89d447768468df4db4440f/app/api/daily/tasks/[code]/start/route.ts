import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { startDailyTask } from '@/lib/daily-rewards';

export async function POST(req: Request, context: RouteContext<'/api/daily/tasks/[code]/start'>) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse('Vui lòng đăng nhập để làm nhiệm vụ');
    const { code } = await context.params;
    const task = await startDailyTask(user.id, code);
    if (!task) {
      return NextResponse.json({ success: false, message: 'Nhiệm vụ không tồn tại' }, { status: 404 });
    }
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Start daily task error:', error);
    return NextResponse.json({ success: false, message: 'Không thể bắt đầu nhiệm vụ' }, { status: 500 });
  }
}
