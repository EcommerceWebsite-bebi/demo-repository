import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Khởi tạo biến đếm toàn cục (in-memory global variable) nếu chưa tồn tại
if (!(global as any).visitorCount) {
  (global as any).visitorCount = 125; 
}

export async function GET() {
  try {
    return NextResponse.json(
      { success: true, count: (global as any).visitorCount },
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
