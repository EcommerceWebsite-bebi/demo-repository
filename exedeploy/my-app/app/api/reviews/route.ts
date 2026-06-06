import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const { product_id, rating, comment } = await req.json();

    if (!product_id || rating === undefined) {
      return NextResponse.json({ success: false, message: 'Please provide product_id and rating' }, { status: 400 });
    }

    const rate = parseInt(rating, 10);
    if (isNaN(rate) || rate < 1 || rate > 5) {
      return NextResponse.json({ success: false, message: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    // Check if product exists
    const product = await query.get<{ id: number }>('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Check if user already reviewed this product
    const existingReview = await query.get<{ id: number }>(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [user.id, product_id]
    );

    if (existingReview) {
      // Update review
      await query.run(
        'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
        [rate, comment || null, existingReview.id]
      );
      
      const updatedReview = await query.get('SELECT * FROM reviews WHERE id = ?', [existingReview.id]);
      return NextResponse.json({
        success: true,
        message: 'Review updated successfully',
        review: updatedReview
      });
    }

    // Insert review
    const result = await query.run(`
      INSERT INTO reviews (user_id, product_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `, [user.id, product_id, rate, comment || null]);

    const newReview = await query.get('SELECT * FROM reviews WHERE id = ?', [result.id]);

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review: newReview
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json({ success: false, message: 'Server error submitting review' }, { status: 500 });
  }
}
