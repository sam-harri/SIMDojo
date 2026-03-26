ALTER TABLE submission DROP COLUMN IF EXISTS mode;
ALTER TABLE submission DROP COLUMN IF EXISTS test_results;
ALTER TABLE submission DROP COLUMN IF EXISTS first_failure;
ALTER TABLE submission DROP COLUMN IF EXISTS program_output;
ALTER TABLE submission DROP COLUMN IF EXISTS peak_memory_kb;

ALTER TABLE submission DROP CONSTRAINT IF EXISTS submission_status_check;
ALTER TABLE submission ADD CONSTRAINT submission_status_check
  CHECK (status = ANY (ARRAY['pending','compiling','running','accepted','wrong_answer','compile_error','runtime_error','time_limit','memory_limit']));
