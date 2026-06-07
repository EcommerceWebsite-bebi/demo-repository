import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let visitor = await query.get<{ count: number }>('SELECT count FROM visitor_stats WHERE id = 1');
    
    if (!visitor) {
      await query.run('INSERT INTO visitor_stats (id, count) VALUES (1, 125)');
      visitor = { count: 125 };
    }

    return NextResponse.json(
      { success: true, count: visitor.count },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Get visitors error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
