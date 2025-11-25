-- =============================================
-- Dog Spotter Database Schema
-- PostgreSQL - Azure Database
-- =============================================

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "avatar" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Create dogs table
CREATE TABLE IF NOT EXISTS "dogs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "description" TEXT NOT NULL,
    "imageUrl" VARCHAR(500),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "breed" VARCHAR(100),
    "color" VARCHAR(100),
    "size" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'encontrado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,

    CONSTRAINT "dogs_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraint
ALTER TABLE "dogs" 
ADD CONSTRAINT "dogs_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "users"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "dogs_userId_idx" ON "dogs"("userId");
CREATE INDEX IF NOT EXISTS "dogs_status_idx" ON "dogs"("status");
CREATE INDEX IF NOT EXISTS "dogs_latitude_longitude_idx" ON "dogs"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "dogs_createdAt_idx" ON "dogs"("createdAt" DESC);

-- =============================================
-- Sample Data (Optional - for testing)
-- =============================================

-- Insert a test user (password: 123456 - bcrypt hashed)
-- INSERT INTO "users" ("id", "email", "password", "name") VALUES 
-- (gen_random_uuid(), 'test@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qJqJ3Z3qJqJ3Z3', 'Test User');

-- =============================================
-- Useful Queries
-- =============================================

-- View all tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- View all dogs with user info
-- SELECT d.*, u.name as user_name, u.email as user_email 
-- FROM dogs d 
-- JOIN users u ON d."userId" = u.id;

-- Count dogs by status
-- SELECT status, COUNT(*) FROM dogs GROUP BY status;

-- Find dogs within a radius (approximate, using bounding box)
-- SELECT * FROM dogs 
-- WHERE latitude BETWEEN -23.6 AND -23.4 
-- AND longitude BETWEEN -47.0 AND -46.8;

