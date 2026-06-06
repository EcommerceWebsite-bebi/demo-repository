import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const row = await query.get<{ count: number }>('SELECT count FROM visitor_stats WHERE id = 1');
    return NextResponse.json({ success: true, count: row ? row.count : 0 });
  } catch (error: any) {
    console.error('Get visitors error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
