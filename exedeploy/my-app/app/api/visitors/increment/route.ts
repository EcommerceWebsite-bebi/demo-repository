import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // Ensure the row exists to avoid updates that affect 0 rows
    const rowExists = await query.get<{ count: number }>('SELECT count FROM visitor_stats WHERE id = 1');
    if (!rowExists) {
      await query.run('INSERT OR IGNORE INTO visitor_stats (id, count) VALUES (1, 0)');
    }
    await query.run('UPDATE visitor_stats SET count = count + 1 WHERE id = 1');
    const row = await query.get<{ count: number }>('SELECT count FROM visitor_stats WHERE id = 1');
    return NextResponse.json({ success: true, count: row ? row.count : 0 });
  } catch (error: any) {
    console.error('Increment visitors error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
