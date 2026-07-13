import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role_name !== 'ADMIN') {
      return forbiddenResponse();
    }

    const coupons = await query.all('SELECT * FROM coupons ORDER BY id DESC');
    return NextResponse.json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error: any) {
    console.error('Get coupons admin error:', error);
    return NextResponse.json({ success: false, message: 'Server error retrieving admin coupons' }, { status: 500 });
  }
}
