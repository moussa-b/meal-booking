import { query, getConnection, type MysqlInsertResult } from '@/lib/db/connection';
import type { Booking, BookingMealParticipant, BookingMenuSelection, BookingWithDetails } from '@/lib/models/booking';
import type { BookingSubmission } from '@/lib/models/booking-submission';
import { PaymentStatus } from '@/lib/models/payment-status';
import { createMealParticipant } from './meal-participant.service';
import { getOrganizationById } from './organization.service';
import { getWeeklyMenuById } from './weekly-menu.service';
import { sendBookingPayLater, sendBookingConfirmationPaid } from './email.service';
import type { FieldPacket } from 'mysql2/promise';

/**
 * Database row type for Booking (as returned from MySQL)
 */
interface BookingRow {
  id: number;
  created: string | Date;
  email: string;
  organizationId: number;
  menuId: number;
  status: string;
  paypalOrderId?: string | null;
  paymentEmailSentAt?: string | Date | null;
  confirmationEmailSentAt?: string | Date | null;
}

/**
 * Database row type for BookingMealParticipant (as returned from MySQL)
 */
interface BookingMealParticipantRow {
  id: number;
  bookingId: number;
  mealParticipantId: number | null;
  lastName: string;
  firstName: string;
  class: string;
  type: 'school' | 'company';
  feedingRegime: string | null;
  email: string;
}

/**
 * Database row type for BookingMenuSelection (as returned from MySQL)
 */
interface BookingMenuSelectionRow {
  id: number;
  bookingId: number;
  bookingMealParticipantId: number;
  weeklyMenuDayId: number;
}

/**
 * Create a new booking with meal participants and menu selections.
 * When sendEmail is true, sends a "pay later" email with link to history page.
 */
export async function createBooking(
  data: BookingSubmission,
  saveChildrenInfo: boolean,
  sendEmail = false
): Promise<Booking> {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Validate organization exists
    const organization = await getOrganizationById(data.organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Validate menu exists
    const menu = await getWeeklyMenuById(data.menuId);
    if (!menu) {
      throw new Error('Weekly menu not found');
    }

    // Validate menu belongs to organization
    if (menu.organizationId !== data.organizationId) {
      throw new Error('Menu does not belong to the specified organization');
    }

    // Get all weeklyMenuDayIds from the menu to validate selections
    const validMenuDayIds = new Set(menu.days?.map(day => day.id) || []);

    // Validate all selected menu days belong to the menu
    for (const selectedIds of Object.values(data.menuSelections)) {
      for (const menuDayId of selectedIds) {
        if (!validMenuDayIds.has(menuDayId)) {
          throw new Error(`Menu day ${menuDayId} does not belong to menu ${data.menuId}`);
        }
      }
    }

    // Insert booking with default PENDING status
    const [bookingResult] = await connection.execute(
      'INSERT INTO bookings (email, organizationId, menuId, status) VALUES (?, ?, ?, ?)',
      [data.email, data.organizationId, data.menuId, PaymentStatus.PENDING]
    ) as [MysqlInsertResult, FieldPacket[]];

    const bookingId = bookingResult.insertId;

    // Process each meal participant
    for (let index = 0; index < data.mealParticipants.length; index++) {
      const mealParticipant = data.mealParticipants[index];
      const mealParticipantKey = `${mealParticipant.firstName}-${mealParticipant.lastName}-${index}`;
      const selectedMenuDayIds = data.menuSelections[mealParticipantKey] || [];

      let savedMealParticipantId: number | null = null;

      if (saveChildrenInfo) {
        const savedMealParticipant = await createMealParticipant({
          lastName: mealParticipant.lastName,
          firstName: mealParticipant.firstName,
          class: mealParticipant.class,
          type: organization.type,
          feedingRegime: mealParticipant.feedingRegime || null,
          email: data.email,
        });
        savedMealParticipantId = savedMealParticipant.id;
      }

      const [mealParticipantResult] = await connection.execute(
        'INSERT INTO booking_meal_participants (bookingId, mealParticipantId, lastName, firstName, class, type, feedingRegime, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          bookingId,
          savedMealParticipantId,
          mealParticipant.lastName,
          mealParticipant.firstName,
          mealParticipant.class,
          organization.type,
          mealParticipant.feedingRegime || null,
          data.email,
        ]
      ) as [MysqlInsertResult, FieldPacket[]];

      const bookingMealParticipantId = mealParticipantResult.insertId;

      for (const weeklyMenuDayId of selectedMenuDayIds) {
        await connection.execute(
          'INSERT INTO booking_menu_selections (bookingId, bookingMealParticipantId, weeklyMenuDayId) VALUES (?, ?, ?)',
          [bookingId, bookingMealParticipantId, weeklyMenuDayId]
        );
      }
    }

    await connection.commit();

    // Retrieve and return the complete booking
    const booking = await getBookingById(bookingId);
    if (!booking) {
      throw new Error('Failed to retrieve created booking');
    }

    if (sendEmail && organization) {
      try {
        await sendBookingPayLater(booking, organization.code, organization.name);
        await updatePaymentEmailSentAt(booking.id);
      } catch (emailError) {
        console.error('Failed to send pay-later email after booking creation:', emailError);
      }
    }

    return booking;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get a booking by ID with all details
 */
export async function getBookingById(id: number): Promise<Booking | null> {
  const bookings = await query<BookingRow[]>(
    'SELECT id, created, email, organizationId, menuId, status, paypalOrderId, paymentEmailSentAt, confirmationEmailSentAt FROM bookings WHERE id = ?',
    [id]
  );

  if (bookings.length === 0) {
    return null;
  }

  const bookingRow = bookings[0];

  // Get all meal participants for this booking
  const mealParticipantsRows = await query<BookingMealParticipantRow[]>(
    'SELECT id, bookingId, mealParticipantId, lastName, firstName, class, type, feedingRegime, email FROM booking_meal_participants WHERE bookingId = ?',
    [id]
  );

  // Get all menu selections
  const selectionsRows = await query<BookingMenuSelectionRow[]>(
    'SELECT id, bookingId, bookingMealParticipantId, weeklyMenuDayId FROM booking_menu_selections WHERE bookingId = ?',
    [id]
  );

  // Group selections by meal participant
  const selectionsByMealParticipantId = new Map<number, BookingMenuSelection[]>();
  for (const selection of selectionsRows) {
    if (!selectionsByMealParticipantId.has(selection.bookingMealParticipantId)) {
      selectionsByMealParticipantId.set(selection.bookingMealParticipantId, []);
    }
    selectionsByMealParticipantId.get(selection.bookingMealParticipantId)!.push({
      id: selection.id,
      bookingId: selection.bookingId,
      bookingMealParticipantId: selection.bookingMealParticipantId,
      weeklyMenuDayId: selection.weeklyMenuDayId,
    });
  }

  // Build meal participants with their selections
  const mealParticipants: BookingMealParticipant[] = mealParticipantsRows.map((mealParticipantRow) => ({
    id: mealParticipantRow.id,
    bookingId: mealParticipantRow.bookingId,
    mealParticipantId: mealParticipantRow.mealParticipantId,
    lastName: mealParticipantRow.lastName,
    firstName: mealParticipantRow.firstName,
    class: mealParticipantRow.class,
    type: mealParticipantRow.type,
    feedingRegime: mealParticipantRow.feedingRegime,
    email: mealParticipantRow.email,
    mealParticipant: null,
    menuSelections: selectionsByMealParticipantId.get(mealParticipantRow.id) || [],
  }));

  // Map status string to PaymentStatus enum
  const status = bookingRow.status as PaymentStatus;

  return {
    id: bookingRow.id,
    created: new Date(bookingRow.created),
    email: bookingRow.email,
    organizationId: bookingRow.organizationId,
    menuId: bookingRow.menuId,
    status,
    mealParticipants,
    paypalOrderId: bookingRow.paypalOrderId ?? null,
    paymentEmailSentAt: bookingRow.paymentEmailSentAt ? new Date(bookingRow.paymentEmailSentAt) : null,
    confirmationEmailSentAt: bookingRow.confirmationEmailSentAt ? new Date(bookingRow.confirmationEmailSentAt) : null,
  };
}

/**
 * Get all bookings by email
 */
export async function getBookingsByEmail(email: string): Promise<Booking[]> {
  const bookings = await query<BookingRow[]>(
    'SELECT id, created, email, organizationId, menuId, status, paypalOrderId, paymentEmailSentAt, confirmationEmailSentAt FROM bookings WHERE email = ? ORDER BY created DESC',
    [email]
  );

  if (bookings.length === 0) {
    return [];
  }

  // Get all bookings with their details
  const bookingsWithDetails = await Promise.all(
    bookings.map((bookingRow) => getBookingById(bookingRow.id))
  );

  return bookingsWithDetails.filter((booking): booking is Booking => booking !== null);
}

/**
 * Update booking payment status.
 * When sendEmail is true and status is PAID, sends a confirmation email with booking summary and history link.
 */
export async function updateBookingStatus(bookingId: number, status: PaymentStatus, sendEmail = false): Promise<void> {
  await query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);

  if (sendEmail && status === PaymentStatus.PAID) {
    try {
      const booking = await getBookingById(bookingId);
      if (!booking) return;
      const organization = await getOrganizationById(booking.organizationId);
      if (!organization) return;
      const menu = await getWeeklyMenuById(booking.menuId);
      if (!menu) return;
      await sendBookingConfirmationPaid(booking, organization.code, organization.name, menu);
      await updateConfirmationEmailSentAt(bookingId);
    } catch (emailError) {
      console.error('Failed to send confirmation email after payment:', emailError);
    }
  }
}

/**
 * Update booking PayPal order ID (stored for reuse/retry)
 */
export async function updateBookingOrderId(bookingId: number, orderId: string): Promise<void> {
  await query('UPDATE bookings SET paypalOrderId = ? WHERE id = ?', [orderId, bookingId]);
}

/**
 * Set confirmationEmailSentAt to current timestamp (when confirmation email is sent).
 */
export async function updateConfirmationEmailSentAt(bookingId: number): Promise<void> {
  await query('UPDATE bookings SET confirmationEmailSentAt = CURRENT_TIMESTAMP WHERE id = ?', [
    bookingId,
  ]);
}

/**
 * Set paymentEmailSentAt to current timestamp (when pay-later email is sent).
 */
export async function updatePaymentEmailSentAt(bookingId: number): Promise<void> {
  await query('UPDATE bookings SET paymentEmailSentAt = CURRENT_TIMESTAMP WHERE id = ?', [
    bookingId,
  ]);
}

/**
 * Get total amount for a booking (sum of menu day prices for all selections)
 */
export async function getBookingTotalAmount(bookingId: number): Promise<number> {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  const menu = await getWeeklyMenuById(booking.menuId);
  if (!menu?.days?.length) {
    throw new Error('Menu not found or has no days');
  }

  const priceMap = new Map(menu.days.map((day) => [day.id, day.price]));
  let total = 0;

  for (const mealParticipant of booking.mealParticipants ?? []) {
    for (const selection of mealParticipant.menuSelections ?? []) {
      const price = priceMap.get(selection.weeklyMenuDayId) ?? 0;
      total += price;
    }
  }

  return Math.round(total * 100) / 100;
}

/**
 * Get count of paid meals per weekday for a given menu.
 * Returns a map dayOfWeek -> count (0 = Monday, 1 = Tuesday, etc.).
 */
export async function getPaidMealsByWeekdayForMenu(
  menuId: number
): Promise<Record<number, number>> {
  const rows = await query<{ dayOfWeek: number; count: number }[]>(
    `SELECT wmd.dayOfWeek, COUNT(*) as count
     FROM booking_menu_selections bms
     JOIN booking_meal_participants bmp ON bmp.id = bms.bookingMealParticipantId
     JOIN bookings b ON b.id = bmp.bookingId AND b.menuId = ? AND b.status = ?
     JOIN weekly_menu_days wmd ON wmd.id = bms.weeklyMenuDayId
     GROUP BY wmd.dayOfWeek`,
    [menuId, PaymentStatus.PAID]
  );

  const result: Record<number, number> = {};
  for (const row of rows) {
    result[row.dayOfWeek] = Number(row.count);
  }
  return result;
}

/**
 * Get booking counts by payment status for a given menu.
 * Returns a map status string -> count.
 */
export async function getBookingCountsByStatusForMenu(
  menuId: number
): Promise<Record<string, number>> {
  const rows = await query<{ status: string; count: number }[]>(
    'SELECT status, COUNT(*) as count FROM bookings WHERE menuId = ? GROUP BY status',
    [menuId]
  );

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.status] = Number(row.count);
  }
  return result;
}

/**
 * Get the total amount (sum of menu day prices) for all PAID bookings for a given menu.
 */
export async function getTotalPaidAmountForMenu(menuId: number): Promise<number> {
  const rows = await query<{ total: number | null }[]>(
    `SELECT SUM(wmd.price) as total
     FROM bookings b
     JOIN booking_meal_participants bmp ON bmp.bookingId = b.id
     JOIN booking_menu_selections bms ON bms.bookingMealParticipantId = bmp.id
     JOIN weekly_menu_days wmd ON wmd.id = bms.weeklyMenuDayId
     WHERE b.menuId = ? AND b.status = ?`,
    [menuId, PaymentStatus.PAID]
  );

  const total = rows[0]?.total;
  if (total == null) return 0;
  return Math.round(Number(total) * 100) / 100;
}

/**
 * Get all bookings with full details
 */
export async function getAllBookings(): Promise<Booking[]> {
  const bookings = await query<BookingRow[]>(
    'SELECT id, created, email, organizationId, menuId, status, paypalOrderId, paymentEmailSentAt, confirmationEmailSentAt FROM bookings ORDER BY created DESC'
  );

  if (bookings.length === 0) {
    return [];
  }

  // Get all bookings with their details
  const bookingsWithDetails = await Promise.all(
    bookings.map((bookingRow) => getBookingById(bookingRow.id))
  );

  return bookingsWithDetails.filter((booking): booking is Booking => booking !== null);
}

/**
 * Get all bookings by email for a given organization, with computed totals and weekStartDate.
 * Used by history views both on the server (history page) and on the client (history wizard).
 */
export async function getBookingsWithDetailsByEmailAndOrganization(
  email: string,
  organizationId: number
): Promise<BookingWithDetails[]> {
  const bookings = await getBookingsByEmail(email);

  if (!bookings.length) {
    return [];
  }

  const bookingsForOrganization = await Promise.all(
    bookings
      .filter((booking) => booking.organizationId === organizationId)
      .map(async (booking): Promise<BookingWithDetails> => {
        const menu = await getWeeklyMenuById(booking.menuId);

        const priceMap = new Map<number, number>();
        let weekStartDate: Date | undefined;

        if (menu?.days?.length) {
          menu.days.forEach((day) => {
            priceMap.set(day.id, day.price);
          });
          weekStartDate = menu.weekStartDate;
        }

        let totalMeals = 0;
        let totalAmount = 0;

        booking.mealParticipants?.forEach((mealParticipant) => {
          mealParticipant.menuSelections?.forEach((selection) => {
            totalMeals++;
            const price = priceMap.get(selection.weeklyMenuDayId) || 0;
            totalAmount += price;
          });
        });

        return {
          ...booking,
          totalMeals,
          totalAmount,
          weekStartDate,
        };
      })
  );

  return bookingsForOrganization;
}

