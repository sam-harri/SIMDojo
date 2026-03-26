-- Drop unused columns from submission
ALTER TABLE submission DROP COLUMN IF EXISTS scalar_time_ns;
ALTER TABLE submission DROP COLUMN IF EXISTS speedup;

-- Replace best_speedup with best_exec_time_ns in problem_completion
ALTER TABLE problem_completion DROP COLUMN IF EXISTS best_speedup;
ALTER TABLE problem_completion ADD COLUMN IF NOT EXISTS best_exec_time_ns BIGINT;
