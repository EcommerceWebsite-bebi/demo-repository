import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const { phone, address, avatar, username } = await req.json();

    const existingUser = await query.get<any>('SELECT * FROM users WHERE id = ?', [user.id]);
    if (!existingUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const newUsername = username !== undefined ? username : existingUser.username;
    const newPhone = phone !== undefined ? phone : existingUser.phone;
    const newAddress = address !== undefined ? address : existingUser.address;
    const newAvatar = avatar !== undefined ? avatar : existingUser.avatar;

    await query.run(`
      UPDATE users
      SET username = ?, phone = ?, address = ?, avatar = ?
      WHERE id = ?
    `, [newUsername, newPhone, newAddress, newAvatar, user.id]);

    const updatedUser = await query.get<any>(`
      SELECT u.id, u.username, u.email, u.avatar, u.phone, u.address, u.role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [user.id]);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, message: 'Server error updating profile' }, { status: 500 });
  }
}
