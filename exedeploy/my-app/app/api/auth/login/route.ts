import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'một_chuỗi_ký_tự_bí_mật_bất_kỳ';

const generateToken = (id: number) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide email and password' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await query.get<any>(`
      SELECT u.*, r.name as role_name 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `, [email.toLowerCase()]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user has a cart, create if not (backwards compatibility/seeding fallback)
    try {
      const cart = await query.get<{ id: number }>('SELECT id FROM carts WHERE user_id = ?', [user.id]);
      if (!cart) {
        await query.run('INSERT INTO carts (user_id) VALUES (?)', [user.id]);
      }
    } catch (e) {
      console.warn('Could not check/create cart in database (Read-only SQLite), skipping...');
    }

    // Generate token
    const token = generateToken(user.id);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        role_name: user.role_name
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Server error during login' }, { status: 500 });
  }
}
