-- Migration: Remove type column from organizations table
-- Description: Drops the type column from organizations

ALTER TABLE organizations DROP COLUMN type;
