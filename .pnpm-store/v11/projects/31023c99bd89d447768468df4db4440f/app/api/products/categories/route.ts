import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const categories = await query.all('SELECT * FROM categories ORDER BY name ASC');
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error('Get categories error:', error);
    return NextResponse.json({ success: false, message: 'Server error retrieving categories' }, { status: 500 });
  }
}
