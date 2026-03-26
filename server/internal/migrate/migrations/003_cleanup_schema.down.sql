ALTER TABLE submission ADD COLUMN IF NOT EXISTS scalar_time_ns BIGINT;
ALTER TABLE submission ADD COLUMN IF NOT EXISTS speedup REAL;

ALTER TABLE problem_completion DROP COLUMN IF EXISTS best_exec_time_ns;
ALTER TABLE problem_completion ADD COLUMN IF NOT EXISTS best_speedup REAL;
