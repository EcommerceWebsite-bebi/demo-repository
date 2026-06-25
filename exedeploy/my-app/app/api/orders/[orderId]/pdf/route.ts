import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { query } from '@/lib/db';
import PDFDocument from 'pdfkit';

// Generate PDF buffer on-demand for a specific order item
async function createDesignPDF(item: any, order: any, user: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header Brand
      doc.fillColor('#1E293B');
      doc.fontSize(20).font('Helvetica-Bold').text('MOUSEEE CUSTOM SHIRT SPECIFICATION', { align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor('#64748B').text('Custom Merchandise Production Sheet', { align: 'center' });
      doc.moveDown(1.5);

      // Info Table Section
      const startY = doc.y;
      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, startY).lineTo(555, startY).stroke();
      doc.moveDown(1);

      // Customer Section (Left)
      doc.fillColor('#1E293B');
      doc.fontSize(12).font('Helvetica-Bold').text('Customer Details', 40, startY + 15);
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica-Bold').text('Name: ', { continued: true }).font('Helvetica').fillColor('#334155').text(user.username || 'N/A');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Email: ', { continued: true }).font('Helvetica').fillColor('#334155').text(user.email || 'N/A');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Phone: ', { continued: true }).font('Helvetica').fillColor('#334155').text(order.phone || 'N/A');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Address: ', { continued: true }).font('Helvetica').fillColor('#334155').text(order.shipping_address || 'N/A');
      if (order.note) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Note: ', { continued: true }).font('Helvetica').fillColor('#334155').text(order.note);
      }

      // Product Section (Right)
      doc.fillColor('#1E293B');
      doc.fontSize(12).font('Helvetica-Bold').text('Garment Specs', 300, startY + 15);
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica-Bold').text('Product: ', 300).font('Helvetica').fillColor('#334155').text(item.product_name || 'Custom Oversize T-Shirt', 360);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Size: ', 300).font('Helvetica').fillColor('#334155').text(item.size || 'M', 360);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Color: ', 300).font('Helvetica').fillColor('#334155').text(item.color || 'Navy', 360);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Quantity: ', 300).font('Helvetica').fillColor('#334155').text(`x${item.quantity}`, 360);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Price: ', 300).font('Helvetica').fillColor('#334155').text(`${item.price.toLocaleString('vi-VN')} VND`, 360);

      doc.moveDown(3);
      const nextY = doc.y;
      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, nextY).lineTo(555, nextY).stroke();
      doc.moveDown(1.5);

      // Artwork Section
      doc.fillColor('#1E293B');
      doc.fontSize(14).font('Helvetica-Bold').text('Artwork Specifications', 40);
      doc.moveDown(1);

      if (item.custom_design_image) {
        const parts = item.custom_design_image.split('|');
        const isBase64 = parts[0].startsWith('data:image');

        if (isBase64) {
          doc.fontSize(10).fillColor('#475569').text('Canvas Studio Custom Designs:', 40);
          doc.moveDown(1);

          let imageY = doc.y;

          // Front image
          try {
            const frontBase64 = parts[0].split(';base64,').pop();
            const frontBuffer = Buffer.from(frontBase64!, 'base64');
            doc.image(frontBuffer, 40, imageY, { width: 220, height: 330 });
            doc.fontSize(10).fillColor('#1E293B').font('Helvetica-Bold').text('MAT TRUOC (FRONT)', 40, imageY + 340, { width: 220, align: 'center' });
          } catch (err) {
            console.error('Front buffer render error:', err);
            doc.fontSize(10).fillColor('#EF4444').text('Failed to render Front Artwork image', 40, imageY);
          }

          // Back image
          if (parts[1]) {
            try {
              const backBase64 = parts[1].split(';base64,').pop();
              const backBuffer = Buffer.from(backBase64!, 'base64');
              doc.image(backBuffer, 300, imageY, { width: 220, height: 330 });
              doc.fontSize(10).fillColor('#1E293B').font('Helvetica-Bold').text('MAT SAU (BACK)', 300, imageY + 340, { width: 220, align: 'center' });
            } catch (err) {
              console.error('Back buffer render error:', err);
              doc.fontSize(10).fillColor('#EF4444').text('Failed to render Back Artwork image', 300, imageY);
            }
          }
        } else {
          // AI generated or URL-based specs
          doc.fontSize(10).fillColor('#475569').text('AI Generated Design Specifications:', 40);
          doc.moveDown(1);

          try {
            const urlObj = new URL(parts[0], 'http://localhost');
            const promptVal = urlObj.searchParams.get('prompt') || 'No prompt';
            const styleVal = urlObj.searchParams.get('style') || 'Minimalist';
            const sizeVal = urlObj.searchParams.get('size') || 'medium';

            const boxY = doc.y;
            doc.rect(40, boxY, 515, 120).fillColor('#F8FAFC').fillAndStroke('#E2E8F0');
            doc.fillColor('#1E293B');
            doc.fontSize(9).font('Helvetica-Bold').text('AI Prompt: ', 50, boxY + 15).font('Helvetica').text(promptVal, 50, boxY + 30, { width: 495 });
            doc.fontSize(9).font('Helvetica-Bold').text('AI Style: ', 50, boxY + 80).font('Helvetica').text(styleVal, 50, boxY + 95);
            doc.fontSize(9).font('Helvetica-Bold').text('AI Resolution Size: ', 200, boxY + 80).font('Helvetica').text(sizeVal, 200, boxY + 95);
          } catch (e) {
            doc.fontSize(10).font('Helvetica').text(`Design Source: ${parts[0]}`);
          }
        }
      } else {
        doc.fontSize(10).font('Helvetica').text('No design image provided.');
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// GET /api/orders/[orderId]/pdf?itemId=123
// Generates and streams a PDF for a specific order item on-demand (no Cloudinary needed)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const { orderId } = await params;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!orderId || !itemId) {
      return NextResponse.json({ success: false, message: 'orderId and itemId are required' }, { status: 400 });
    }

    // Fetch the order (ensure it belongs to this user or they are admin)
    const isAdmin = user.role_name === 'ADMIN';
    const order = isAdmin
      ? await query.get<any>('SELECT o.*, u.username, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?', [orderId])
      : await query.get<any>('SELECT o.*, ? as username, ? as email FROM orders o WHERE o.id = ? AND o.user_id = ?', [user.username, user.email, orderId, user.id]);

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found or access denied' }, { status: 404 });
    }

    // Fetch the specific order item
    const item = await query.get<any>(`
      SELECT oi.*, p.name as product_name, p.image as product_image
      FROM order_items oi
      INNER JOIN products p ON oi.product_id = p.id
      WHERE oi.id = ? AND oi.order_id = ?
    `, [itemId, orderId]);

    if (!item) {
      return NextResponse.json({ success: false, message: 'Order item not found' }, { status: 404 });
    }

    if (!item.custom_design_image) {
      return NextResponse.json({ success: false, message: 'This item has no custom design' }, { status: 400 });
    }

    // Generate PDF on-demand
    const userInfo = { username: order.username || user.username, email: order.email || user.email };
    const pdfBuffer = await createDesignPDF(item, order, userInfo);

    const fileName = `mouseee-order-${orderId}-item-${itemId}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });

  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate PDF: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
