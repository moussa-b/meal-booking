-- Migration: Add type column to organizations table
-- Description: Adds a type column to classify organizations

ALTER TABLE organizations ADD COLUMN type VARCHAR(100) NOT NULL DEFAULT 'school';
