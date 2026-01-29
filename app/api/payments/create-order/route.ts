import { NextRequest, NextResponse } from 'next/server';
import { getBookingById } from '@/lib/services/booking.service';
import { getBookingTotalAmount } from '@/lib/services/booking.service';
import { getPayPalAccessToken, PAYPAL_API_BASE } from '@/lib/services/paypal.service';
import { PaymentStatus } from '@/lib/models/payment-status';
import { z } from 'zod';

const createOrderSchema = z.object({
  bookingId: z.number().int().positive(),
});

/**
 * POST /api/payments/create-order
 * Create a PayPal order for an unpaid booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = createOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid bookingId' },
        { status: 400 }
      );
    }

    const { bookingId } = parseResult.data;

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status === PaymentStatus.PAID) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Booking is already paid' },
        { status: 400 }
      );
    }

    const total = await getBookingTotalAmount(bookingId);
    if (total <= 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Booking has no amount to pay' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();
    const value = total.toFixed(2);

    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: String(bookingId),
            amount: {
              currency_code: 'EUR',
              value,
            },
          },
        ],
      }),
    });

    if (!orderResponse.ok) {
      const errText = await orderResponse.text();
      console.error('PayPal create order failed:', orderResponse.status, errText);
      return NextResponse.json(
        { error: 'Payment Error', message: 'Failed to create PayPal order' },
        { status: 502 }
      );
    }

    const orderData = (await orderResponse.json()) as { id: string };
    return NextResponse.json({ orderId: orderData.id });
  } catch (error) {
    console.error('Create order error:', error);
    if (error instanceof Error && error.message.includes('PayPal credentials')) {
      return NextResponse.json(
        { error: 'Configuration Error', message: error.message },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create order' },
      { status: 500 }
    );
  }
}
