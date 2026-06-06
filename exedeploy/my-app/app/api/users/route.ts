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

    const users = await query.all(`
      SELECT u.id, u.username, u.email, u.avatar, u.phone, u.address, u.role_id, r.name as role_name, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    return NextResponse.json({ success: false, message: 'Server error retrieving users' }, { status: 500 });
  }
}
