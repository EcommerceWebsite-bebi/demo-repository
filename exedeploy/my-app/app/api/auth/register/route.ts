import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';

const generateToken = (id: number) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

export async function POST(req: Request) {
  try {
    const { username, email, password, phone, address } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide username, email and password' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await query.get<{ id: number }>('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (userExists) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Get default role (USER)
    const userRole = await query.get<{ id: number }>("SELECT id FROM roles WHERE name = 'USER'");
    const roleId = userRole ? userRole.id : 1;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const result = await query.run(`
      INSERT INTO users (username, email, password, phone, address, role_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [username, email.toLowerCase(), hashedPassword, phone || null, address || null, roleId]);

    // Create a cart for the new user automatically
    await query.run('INSERT INTO carts (user_id) VALUES (?)', [result.id]);

    // Generate token
    const token = generateToken(result.id);

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: result.id,
        username,
        email: email.toLowerCase(),
        phone: phone || null,
        address: address || null,
        role_name: 'USER'
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: 'Server error during registration' }, { status: 500 });
  }
}
