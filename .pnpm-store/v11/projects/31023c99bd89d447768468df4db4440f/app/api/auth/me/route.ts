import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error('Get profile me error:', error);
    return NextResponse.json({ success: false, message: 'Server error retrieving profile' }, { status: 500 });
  }
}
