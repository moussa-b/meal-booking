import { NextRequest, NextResponse } from 'next/server';
import { getBookingById, updateBookingStatus } from '@/lib/services/booking.service';
import { getPayPalAccessToken, PAYPAL_API_BASE } from '@/lib/services/paypal.service';
import { PaymentStatus } from '@/lib/models/payment-status';
import { z } from 'zod';

const captureSchema = z.object({
  orderId: z.string().min(1),
  bookingId: z.number().int().positive(),
});

/**
 * POST /api/public/payments/capture
 * Capture a PayPal order and set booking status to PAID.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = captureSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid orderId or bookingId' },
        { status: 400 }
      );
    }

    const { orderId, bookingId } = parseResult.data;

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Booking not found' },
        { status: 404 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      }
    );

    if (!captureResponse.ok) {
      const errText = await captureResponse.text();
      console.error('PayPal capture failed:', captureResponse.status, errText);
      return NextResponse.json(
        { error: 'Payment Error', message: 'Failed to capture payment' },
        { status: 502 }
      );
    }

    await updateBookingStatus(bookingId, PaymentStatus.PAID, true);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Capture error:', error);
    if (error instanceof Error && error.message.includes('PayPal credentials')) {
      return NextResponse.json(
        { error: 'Configuration Error', message: error.message },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to capture payment' },
      { status: 500 }
    );
  }
}
