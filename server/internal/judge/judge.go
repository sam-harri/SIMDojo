package judge

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/semaphore"

	"simdojo/judge/internal/problems"
)

type Judge struct {
	pool              *pgxpool.Pool
	store             *problems.Store
	runner            *Runner
	extraCompileFlags string
	sem               *semaphore.Weighted
}

func New(pool *pgxpool.Pool, store *problems.Store, devMode bool, extraCompileFlags string) *Judge {
	maxWorkers := int64(runtime.NumCPU())
	if maxWorkers < 2 {
		maxWorkers = 2
	}
	slog.Info("judge initialized", "max_concurrent", maxWorkers)
	return &Judge{
		pool:              pool,
		store:             store,
		runner:            NewRunner(devMode),
		extraCompileFlags: extraCompileFlags,
		sem:               semaphore.NewWeighted(maxWorkers),
	}
}

// Submit handles a code submission asynchronously (full judge, submit mode).
// Launches a background goroutine — intentionally detached from the HTTP request context.
func (j *Judge) Submit(submissionID int64, problemSlug, code string) {
	go func() {
		ctx := context.Background()
		if err := j.sem.Acquire(ctx, 1); err != nil {
			slog.Error("acquire semaphore", "submission_id", submissionID, "error", err)
			return
		}
		defer j.sem.Release(1)
		if err := j.evaluate(ctx, submissionID, problemSlug, code, "submit"); err != nil {
			slog.Error("judge failed", "submission_id", submissionID, "error", err)
			j.updateStatus(ctx, submissionID, "internal_error", 0, 0, nil, nil, err.Error())
		}
	}()
}

// Run handles a code run asynchronously (sample tests only, run mode).
// Launches a background goroutine — intentionally detached from the HTTP request context.
func (j *Judge) Run(submissionID int64, problemSlug, code string) {
	go func() {
		ctx := context.Background()
		if err := j.sem.Acquire(ctx, 1); err != nil {
			slog.Error("acquire semaphore", "submission_id", submissionID, "error", err)
			return
		}
		defer j.sem.Release(1)
		if err := j.evaluate(ctx, submissionID, problemSlug, code, "run"); err != nil {
			slog.Error("run failed", "submission_id", submissionID, "error", err)
			j.updateStatus(ctx, submissionID, "internal_error", 0, 0, nil, nil, err.Error())
		}
	}()
}

func (j *Judge) evaluate(ctx context.Context, submissionID int64, problemSlug, code, mode string) error {
	// Get problem config
	prob, ok := j.store.Get(problemSlug)
	if !ok {
		return fmt.Errorf("problem not found: %s", problemSlug)
	}

	// Check for dangerous code
	if err := checkDangerousCode(code); err != nil {
		j.updateStatus(ctx, submissionID, "compile_error", 0, 0, nil, nil, fmt.Sprintf("Forbidden code: %s", err.Error()))
		return nil
	}

	// Create temp directory
	workDir, err := os.MkdirTemp("", "simdojo-submission-*")
	if err != nil {
		return fmt.Errorf("create temp dir: %w", err)
	}
	defer os.RemoveAll(workDir)

	// Write user code as solution.cpp (harness includes this)
	solutionPath := filepath.Join(workDir, "solution.cpp")
	if err := os.WriteFile(solutionPath, []byte(code), 0644); err != nil {
		return fmt.Errorf("write solution: %w", err)
	}

	// Copy harness to work dir
	problemDir := j.store.Dir(problemSlug)
	harnessData, err := os.ReadFile(filepath.Join(problemDir, "harness.cpp"))
	if err != nil {
		return fmt.Errorf("read harness: %w", err)
	}
	harnessPath := filepath.Join(workDir, "harness.cpp")
	if err := os.WriteFile(harnessPath, harnessData, 0644); err != nil {
		return fmt.Errorf("write harness: %w", err)
	}

	// Update status to compiling
	j.updateStatus(ctx, submissionID, "compiling", 0, 0, nil, nil, "")

	// Compile
	binaryPath := filepath.Join(workDir, "submission")
	compileFlags := prob.Config.CompileFlags
	if compileFlags == "" {
		compileFlags = "-std=c++17 -mavx2 -O2"
	}
	if j.extraCompileFlags != "" {
		compileFlags = j.extraCompileFlags + " " + compileFlags
	}

	compileResult, err := compile(ctx, workDir, harnessPath, binaryPath, compileFlags)
	if err != nil {
		return fmt.Errorf("compile: %w", err)
	}
	if !compileResult.Success {
		j.updateStatus(ctx, submissionID, "compile_error", 0, 0, &compileResult.Output, nil, "")
		return nil
	}

	// Update status to running
	j.updateStatus(ctx, submissionID, "running", 0, 0, nil, nil, "")

	// Execute with mode env var
	timeout := time.Duration(prob.Config.TimeLimitSeconds) * time.Second
	if timeout == 0 {
		timeout = 5 * time.Second
	}
	memoryMB := prob.Config.MemoryLimitMB
	if memoryMB == 0 {
		memoryMB = 128
	}

	env := []string{"SIMDOJO_MODE=" + mode}
	runResult, err := j.runner.Execute(ctx, binaryPath, timeout, memoryMB, workDir, env)
	if err != nil {
		return fmt.Errorf("execute: %w", err)
	}

	// Only capture program output in run mode (truncated to 4KB)
	var programOutput string
	if mode == "run" {
		programOutput = truncateStr(runResult.Stdout, 4000)
	}

	if runResult.TimedOut {
		j.updateStatusFull(ctx, submissionID, "time_limit", 0, 0, nil, strPtr("Time limit exceeded"), nil, nil, nullStr(programOutput))
		return nil
	}

	if runResult.MemoryExceeded {
		msg := fmt.Sprintf("Memory limit exceeded (used ~%d MB, limit %d MB)", runResult.PeakMemoryKB/1024, memoryMB)
		j.updateStatusFull(ctx, submissionID, "memory_limit", 0, 0, nil, strPtr(msg), nil, nil, nullStr(programOutput))
		return nil
	}

	// Read result from file instead of stdout
	resultPath := filepath.Join(workDir, "__result.json")
	harnessOut, err := parseHarnessOutputFile(resultPath)
	if err != nil {
		if runResult.ExitCode != 0 {
			// Runtime error — no result file produced
			runtimeErr := runResult.Stderr
			if runtimeErr == "" {
				runtimeErr = fmt.Sprintf("Process exited with code %d", runResult.ExitCode)
			}
			j.updateStatusFull(ctx, submissionID, "runtime_error", 0, 0, nil, &runtimeErr, nil, nil, nullStr(programOutput))
			return nil
		}
		return fmt.Errorf("parse output: %w", err)
	}

	// Determine status
	status := "wrong_answer"
	if harnessOut.TestsPassed == harnessOut.TestsTotal {
		status = "accepted"
	}

	// Execution time from harness (submit mode only)
	execTimeNs := harnessOut.ExecTimeNs

	// Peak memory from process rusage
	var peakMemoryKB *int64
	if runResult.PeakMemoryKB > 0 {
		pk := runResult.PeakMemoryKB
		peakMemoryKB = &pk
	}

	// Marshal test_results and first_failure as JSON for storage
	var testResultsJSON, firstFailureJSON []byte
	if mode == "run" && len(harnessOut.Results) > 0 {
		testResultsJSON, _ = json.Marshal(harnessOut.Results)
	}
	if harnessOut.FirstFailure != nil {
		firstFailureJSON, _ = json.Marshal(harnessOut.FirstFailure)
	}

	// Update submission with full results
	_, err = j.pool.Exec(ctx, `
		UPDATE submission SET
			status = $2,
			tests_passed = $3,
			tests_total = $4,
			exec_time_ns = $5,
			test_results = $6,
			first_failure = $7,
			program_output = $8,
			peak_memory_kb = $9
		WHERE id = $1
	`, submissionID, status, harnessOut.TestsPassed, harnessOut.TestsTotal,
		execTimeNs, nullableJSON(testResultsJSON), nullableJSON(firstFailureJSON), nullStr(programOutput), peakMemoryKB)
	if err != nil {
		return fmt.Errorf("update submission: %w", err)
	}

	// If accepted in submit mode, upsert problem_completion
	if status == "accepted" && mode == "submit" {
		_, err = j.pool.Exec(ctx, `
			INSERT INTO problem_completion (user_id, problem_id, best_submission_id, best_exec_time_ns)
			SELECT s.user_id, s.problem_id, s.id, s.exec_time_ns
			FROM submission s WHERE s.id = $1
			ON CONFLICT (user_id, problem_id) DO UPDATE SET
				best_submission_id = CASE
					WHEN EXCLUDED.best_exec_time_ns IS NOT NULL
						AND (problem_completion.best_exec_time_ns IS NULL
							OR EXCLUDED.best_exec_time_ns < problem_completion.best_exec_time_ns)
					THEN EXCLUDED.best_submission_id
					ELSE problem_completion.best_submission_id
				END,
				best_exec_time_ns = LEAST(
					problem_completion.best_exec_time_ns,
					EXCLUDED.best_exec_time_ns
				)
		`, submissionID)
		if err != nil {
			slog.Error("failed to upsert completion", "error", err)
		}
	}

	slog.Info("submission judged",
		"id", submissionID,
		"mode", mode,
		"status", status,
		"passed", harnessOut.TestsPassed,
		"total", harnessOut.TestsTotal,
	)

	return nil
}

func (j *Judge) updateStatus(ctx context.Context, id int64, status string, passed, total int, compilerOutput, runtimeOutput *string, errMsg string) {
	ro := runtimeOutput
	if errMsg != "" && ro == nil {
		ro = &errMsg
	}
	j.updateStatusFull(ctx, id, status, passed, total, compilerOutput, ro, nil, nil, nil)
}

func (j *Judge) updateStatusFull(ctx context.Context, id int64, status string, passed, total int, compilerOutput, runtimeOutput *string, testResults, firstFailure []byte, programOutput *string) {
	query := `UPDATE submission SET status = $2, tests_passed = $3, tests_total = $4`
	args := []any{id, status, passed, total}
	argIdx := 5

	if compilerOutput != nil {
		query += fmt.Sprintf(", compiler_output = $%d", argIdx)
		args = append(args, *compilerOutput)
		argIdx++
	}

	if runtimeOutput != nil {
		query += fmt.Sprintf(", runtime_output = $%d", argIdx)
		args = append(args, *runtimeOutput)
		argIdx++
	}

	if testResults != nil {
		query += fmt.Sprintf(", test_results = $%d", argIdx)
		args = append(args, testResults)
		argIdx++
	}

	if firstFailure != nil {
		query += fmt.Sprintf(", first_failure = $%d", argIdx)
		args = append(args, firstFailure)
		argIdx++
	}

	if programOutput != nil {
		query += fmt.Sprintf(", program_output = $%d", argIdx)
		args = append(args, *programOutput)
		argIdx++
	}

	query += " WHERE id = $1"

	if _, err := j.pool.Exec(ctx, query, args...); err != nil {
		slog.Error("failed to update submission status", "id", id, "error", err)
	}
}

func strPtr(s string) *string {
	return &s
}

func nullStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func nullableJSON(data []byte) []byte {
	if len(data) == 0 {
		return nil
	}
	return data
}

func truncateStr(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "\n... (truncated)"
}
