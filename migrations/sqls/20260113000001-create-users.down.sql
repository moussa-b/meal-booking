-- Migration: Drop users table
-- Description: Drops the users table (rollback for create-users)

DROP TABLE IF EXISTS users;
