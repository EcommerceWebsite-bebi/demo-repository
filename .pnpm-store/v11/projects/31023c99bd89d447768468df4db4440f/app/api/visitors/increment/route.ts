import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    const visitor = await query.get<{ count: number }>('SELECT count FROM visitor_stats WHERE id = 1');
    
    let newCount = 126;
    if (!visitor) {
      await query.run('INSERT INTO visitor_stats (id, count) VALUES (1, 126)');
    } else {
      newCount = visitor.count + 1;
      await query.run('UPDATE visitor_stats SET count = ? WHERE id = 1', [newCount]);
    }

    return NextResponse.json({ success: true, count: newCount });
  } catch (error: any) {
    console.error('Increment visitors error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
