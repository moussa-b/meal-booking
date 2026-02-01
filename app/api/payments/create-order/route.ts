import { NextRequest, NextResponse } from 'next/server';
import {
  getBookingById,
  getBookingTotalAmount,
  updateBookingOrderId,
} from '@/lib/services/booking.service';
import { getPayPalAccessToken, PAYPAL_API_BASE } from '@/lib/services/paypal.service';
import { PaymentStatus } from '@/lib/models/payment-status';
import { z } from 'zod';

const createOrderSchema = z.object({
  bookingId: z.number().int().positive(),
});

/** PayPal order statuses that allow reusing the order (user can still approve or we can capture) */
const REUSABLE_ORDER_STATUSES = ['CREATED', 'APPROVED'];

/** Extract approval URL from PayPal order response links */
function getApprovalUrl(orderJson: { links?: Array<{ href: string; rel: string }> }): string | null {
  const link = orderJson.links?.find((l) => l.rel === 'approve');
  return link?.href ?? null;
}

/**
 * POST /api/payments/create-order
 * Create a PayPal order for an unpaid booking, or reuse existing valid orderId if stored.
 * Returns { orderId, approvalUrl } for redirect/popup flow.
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // Reuse existing PayPal order if stored and still valid
    if (booking.paypalOrderId) {
      const getOrderRes = await fetch(
        `${PAYPAL_API_BASE}/v2/checkout/orders/${booking.paypalOrderId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (getOrderRes.ok) {
        const existingOrder = (await getOrderRes.json()) as { status?: string; links?: Array<{ href: string; rel: string }> };
        if (existingOrder.status && REUSABLE_ORDER_STATUSES.includes(existingOrder.status)) {
          const approvalUrl = getApprovalUrl(existingOrder);
          return NextResponse.json({
            orderId: booking.paypalOrderId,
            approvalUrl: approvalUrl ?? undefined,
          });
        }
      }
      // Order missing, expired, or already captured — fall through to create new
    }

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
        application_context: {
          return_url: `${baseUrl}/booking/return?bookingId=${bookingId}`,
          cancel_url: `${baseUrl}/booking/cancel?bookingId=${bookingId}`,
        },
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

    const orderData = (await orderResponse.json()) as {
      id: string;
      links?: Array<{ href: string; rel: string }>;
    };
    await updateBookingOrderId(bookingId, orderData.id);
    const approvalUrl = getApprovalUrl(orderData);

    return NextResponse.json({
      orderId: orderData.id,
      approvalUrl: approvalUrl ?? undefined,
    });
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
