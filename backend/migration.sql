-- PostgreSQL Migration Script
-- Run this manually if the automatic migration doesn't work

-- Add missing columns to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_time TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_time TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS mistake_corrected BOOLEAN DEFAULT FALSE;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'trades' AND table_schema = 'public'
ORDER BY ordinal_position;