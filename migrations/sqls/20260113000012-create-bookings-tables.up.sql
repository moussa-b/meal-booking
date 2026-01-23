-- Migration: Create bookings tables
-- Description: Creates the bookings, booking_students, and booking_menu_selections tables, and adds parentEmail to students

-- Add parentEmail column to students table
ALTER TABLE students ADD COLUMN parentEmail VARCHAR(255) NULL;
CREATE INDEX idx_parent_email ON students (parentEmail);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  email VARCHAR(255) NOT NULL,
  schoolId INT NOT NULL,
  menuId INT NOT NULL,
  FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE RESTRICT,
  FOREIGN KEY (menuId) REFERENCES weekly_menus(id) ON DELETE RESTRICT,
  INDEX idx_email (email),
  INDEX idx_school_id (schoolId),
  INDEX idx_menu_id (menuId),
  INDEX idx_created (created)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create booking_students table
CREATE TABLE IF NOT EXISTS booking_students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bookingId INT NOT NULL,
  studentId INT NULL,
  lastName VARCHAR(255) NOT NULL,
  firstName VARCHAR(255) NOT NULL,
  class VARCHAR(100) NOT NULL,
  feedingRegime VARCHAR(255) NULL,
  parentEmail VARCHAR(255) NOT NULL,
  FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL,
  INDEX idx_booking_id (bookingId),
  INDEX idx_student_id (studentId),
  INDEX idx_parent_email (parentEmail)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create booking_menu_selections table
CREATE TABLE IF NOT EXISTS booking_menu_selections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bookingId INT NOT NULL,
  bookingStudentId INT NOT NULL,
  weeklyMenuDayId INT NOT NULL,
  FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (bookingStudentId) REFERENCES booking_students(id) ON DELETE CASCADE,
  FOREIGN KEY (weeklyMenuDayId) REFERENCES weekly_menu_days(id) ON DELETE RESTRICT,
  INDEX idx_booking_id (bookingId),
  INDEX idx_booking_student_id (bookingStudentId),
  INDEX idx_weekly_menu_day_id (weeklyMenuDayId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
