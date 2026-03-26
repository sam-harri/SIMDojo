ALTER TABLE submission ADD COLUMN mode TEXT NOT NULL DEFAULT 'submit';
ALTER TABLE submission ADD COLUMN test_results JSONB;
ALTER TABLE submission ADD COLUMN first_failure JSONB;
ALTER TABLE submission ADD COLUMN program_output TEXT;
ALTER TABLE submission ADD COLUMN peak_memory_kb BIGINT;

-- Update status check to include internal_error
ALTER TABLE submission DROP CONSTRAINT IF EXISTS submission_status_check;
ALTER TABLE submission ADD CONSTRAINT submission_status_check
  CHECK (status = ANY (ARRAY['pending','compiling','running','accepted','wrong_answer','compile_error','runtime_error','time_limit','memory_limit','internal_error']));
