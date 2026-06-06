import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/upload';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'Không tìm thấy tệp tin hoặc định dạng tệp tin không hợp lệ.' 
      }, { status: 400 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary directly as stream/buffer
    const secureUrl = await uploadToCloudinary(buffer, 'tshirt_shop_custom_designs');

    return NextResponse.json({
      success: true,
      message: 'Tải ảnh lên Cloudinary thành công!',
      imageUrl: secureUrl
    });

  } catch (error: any) {
    console.error('Lỗi khi upload ảnh lên Cloudinary:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi máy chủ trong quá trình tải ảnh lên Cloudinary.',
      error: error.message
    }, { status: 500 });
  }
}
