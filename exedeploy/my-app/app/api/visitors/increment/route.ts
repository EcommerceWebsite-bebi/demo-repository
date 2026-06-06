import { NextResponse } from 'next/server';

// Khởi tạo biến đếm toàn cục nếu chưa tồn tại
if (!(global as any).visitorCount) {
  (global as any).visitorCount = 125;
}

export async function POST() {
  try {
    (global as any).visitorCount += 1;
    return NextResponse.json({ success: true, count: (global as any).visitorCount });
  } catch (error: any) {
    console.error('Increment visitors error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
