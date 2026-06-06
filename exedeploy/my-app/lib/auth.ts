import jwt from 'jsonwebtoken';
import { query } from './db';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  address: string | null;
  role_id: number;
  role_name: string;
}

/**
 * Extracts and verifies JWT from Request headers, retrieving the user record.
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    if (!decoded || !decoded.id) {
      return null;
    }

    const user = await query.get<AuthenticatedUser>(`
      SELECT u.id, u.username, u.email, u.avatar, u.phone, u.address, u.role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [decoded.id]);

    return user || null;
  } catch (error) {
    console.error('JWT authentication helper error:', error);
    return null;
  }
}

/**
 * Quick response generator for unauthorized requests.
 */
export function unauthorizedResponse(message = 'Not authorized, token failed') {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

/**
 * Quick response generator for forbidden requests.
 */
export function forbiddenResponse(message = 'Not authorized to access this resource') {
  return NextResponse.json({ success: false, message }, { status: 403 });
}
