-- Add tags array column to problem table
ALTER TABLE problem ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- Constrain tags to valid values
DO $$ BEGIN
  ALTER TABLE problem ADD CONSTRAINT problem_tags_check
    CHECK (tags <@ ARRAY['arithmetic','comparison','load-store','shuffle','masking','reduction','bitwise','branchless']::text[]);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
