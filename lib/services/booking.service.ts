import { query, getConnection, type MysqlInsertResult } from '@/lib/db/connection';
import type { Booking, BookingStudent, BookingMenuSelection } from '@/lib/models/booking';
import type { BookingSubmission } from '@/lib/models/booking-submission';
import { createStudent } from './student.service';
import { getSchoolById } from './school.service';
import { getWeeklyMenuById } from './weekly-menu.service';
import type { FieldPacket } from 'mysql2/promise';

/**
 * Database row type for Booking (as returned from MySQL)
 */
interface BookingRow {
  id: number;
  created: string | Date;
  email: string;
  schoolId: number;
  menuId: number;
}

/**
 * Database row type for BookingStudent (as returned from MySQL)
 */
interface BookingStudentRow {
  id: number;
  bookingId: number;
  studentId: number | null;
  lastName: string;
  firstName: string;
  class: string;
  feedingRegime: string | null;
  parentEmail: string;
}

/**
 * Database row type for BookingMenuSelection (as returned from MySQL)
 */
interface BookingMenuSelectionRow {
  id: number;
  bookingId: number;
  bookingStudentId: number;
  weeklyMenuDayId: number;
}

/**
 * Create a new booking with students and menu selections
 */
export async function createBooking(
  data: BookingSubmission,
  saveChildrenInfo: boolean
): Promise<Booking> {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Validate school exists
    const school = await getSchoolById(data.schoolId);
    if (!school) {
      throw new Error('School not found');
    }

    // Validate menu exists
    const menu = await getWeeklyMenuById(data.menuId);
    if (!menu) {
      throw new Error('Weekly menu not found');
    }

    // Validate menu belongs to school
    if (menu.schoolId !== data.schoolId) {
      throw new Error('Menu does not belong to the specified school');
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

    // Insert booking
    const [bookingResult] = await connection.execute(
      'INSERT INTO bookings (email, schoolId, menuId) VALUES (?, ?, ?)',
      [data.email, data.schoolId, data.menuId]
    ) as [MysqlInsertResult, FieldPacket[]];

    const bookingId = bookingResult.insertId;

    // Process each student
    const studentIds: number[] = [];
    for (let index = 0; index < data.students.length; index++) {
      const student = data.students[index];
      const studentKey = `${student.firstName}-${student.lastName}-${index}`;
      const selectedMenuDayIds = data.menuSelections[studentKey] || [];

      let savedStudentId: number | null = null;

      // If saveChildrenInfo is true, create or find student
      if (saveChildrenInfo) {
        const savedStudent = await createStudent({
          lastName: student.lastName,
          firstName: student.firstName,
          class: student.class,
          feedingRegime: student.feedingRegime || null,
          parentEmail: data.email,
        });
        savedStudentId = savedStudent.id;
      }

      // Insert booking student
      const [studentResult] = await connection.execute(
        'INSERT INTO booking_students (bookingId, studentId, lastName, firstName, class, feedingRegime, parentEmail) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          bookingId,
          savedStudentId,
          student.lastName,
          student.firstName,
          student.class,
          student.feedingRegime || null,
          data.email,
        ]
      ) as [MysqlInsertResult, FieldPacket[]];

      const bookingStudentId = studentResult.insertId;
      studentIds.push(bookingStudentId);

      // Insert menu selections for this student
      for (const weeklyMenuDayId of selectedMenuDayIds) {
        await connection.execute(
          'INSERT INTO booking_menu_selections (bookingId, bookingStudentId, weeklyMenuDayId) VALUES (?, ?, ?)',
          [bookingId, bookingStudentId, weeklyMenuDayId]
        );
      }
    }

    await connection.commit();

    // Retrieve and return the complete booking
    const booking = await getBookingById(bookingId);
    if (!booking) {
      throw new Error('Failed to retrieve created booking');
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
    'SELECT id, created, email, schoolId, menuId FROM bookings WHERE id = ?',
    [id]
  );

  if (bookings.length === 0) {
    return null;
  }

  const bookingRow = bookings[0];

  // Get all students for this booking
  const studentsRows = await query<BookingStudentRow[]>(
    'SELECT id, bookingId, studentId, lastName, firstName, class, feedingRegime, parentEmail FROM booking_students WHERE bookingId = ?',
    [id]
  );

  // Get all menu selections
  const selectionsRows = await query<BookingMenuSelectionRow[]>(
    'SELECT id, bookingId, bookingStudentId, weeklyMenuDayId FROM booking_menu_selections WHERE bookingId = ?',
    [id]
  );

  // Group selections by student
  const selectionsByStudentId = new Map<number, BookingMenuSelection[]>();
  for (const selection of selectionsRows) {
    if (!selectionsByStudentId.has(selection.bookingStudentId)) {
      selectionsByStudentId.set(selection.bookingStudentId, []);
    }
    selectionsByStudentId.get(selection.bookingStudentId)!.push({
      id: selection.id,
      bookingId: selection.bookingId,
      bookingStudentId: selection.bookingStudentId,
      weeklyMenuDayId: selection.weeklyMenuDayId,
    });
  }

  // Build students with their selections
  const students: BookingStudent[] = studentsRows.map((studentRow) => ({
    id: studentRow.id,
    bookingId: studentRow.bookingId,
    studentId: studentRow.studentId,
    lastName: studentRow.lastName,
    firstName: studentRow.firstName,
    class: studentRow.class,
    feedingRegime: studentRow.feedingRegime,
    parentEmail: studentRow.parentEmail,
    student: null, // Can be populated later if needed
    menuSelections: selectionsByStudentId.get(studentRow.id) || [],
  }));

  return {
    id: bookingRow.id,
    created: new Date(bookingRow.created),
    email: bookingRow.email,
    schoolId: bookingRow.schoolId,
    menuId: bookingRow.menuId,
    students,
  };
}

/**
 * Get all bookings by email
 */
export async function getBookingsByEmail(email: string): Promise<Booking[]> {
  const bookings = await query<BookingRow[]>(
    'SELECT id, created, email, schoolId, menuId FROM bookings WHERE email = ? ORDER BY created DESC',
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
