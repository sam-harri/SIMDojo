package judge

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"syscall"
	"time"
)

type RunResult struct {
	Stdout         string
	Stderr         string
	ExitCode       int
	TimedOut       bool
	MemoryExceeded bool
	PeakMemoryKB   int64 // peak RSS in kilobytes
}

type Runner struct {
	devMode bool
}

func NewRunner(devMode bool) *Runner {
	return &Runner{devMode: devMode}
}

func (r *Runner) Execute(ctx context.Context, binaryPath string, timeout time.Duration, memoryMB int, workDir string, env []string) (*RunResult, error) {
	if r.devMode {
		return r.executeDirect(ctx, binaryPath, timeout, memoryMB, workDir, env)
	}
	return r.executeNsjail(ctx, binaryPath, timeout, memoryMB, workDir, env)
}

func (r *Runner) executeDirect(ctx context.Context, binaryPath string, timeout time.Duration, memoryMB int, workDir string, env []string) (*RunResult, error) {
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	var stdout, stderr bytes.Buffer
	cmd := exec.CommandContext(ctx, binaryPath)
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	cmd.Dir = workDir
	if len(env) > 0 {
		cmd.Env = append(os.Environ(), env...)
	}

	err := cmd.Run()

	result := &RunResult{
		Stdout: stdout.String(),
		Stderr: stderr.String(),
	}

	// Extract peak memory from process state
	if cmd.ProcessState != nil {
		result.PeakMemoryKB = peakMemoryKB(cmd.ProcessState)
	}

	if ctx.Err() == context.DeadlineExceeded {
		result.TimedOut = true
		return result, nil
	}

	// Check memory limit (dev mode — no OS-level enforcement, so check after the fact)
	if memoryMB > 0 && result.PeakMemoryKB > int64(memoryMB)*1024 {
		result.MemoryExceeded = true
		return result, nil
	}

	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			result.ExitCode = exitErr.ExitCode()
		} else {
			return nil, fmt.Errorf("execute binary: %w", err)
		}
	}

	return result, nil
}

func (r *Runner) executeNsjail(ctx context.Context, binaryPath string, timeout time.Duration, memoryMB int, workDir string, env []string) (*RunResult, error) {
	timeoutSec := int(timeout.Seconds())
	if timeoutSec < 1 {
		timeoutSec = 1
	}

	args := []string{
		"--mode", "once",
		"--time_limit", fmt.Sprintf("%d", timeoutSec),
		"--max_cpus", "1",
		"--rlimit_as", fmt.Sprintf("%d", memoryMB),
		"--rlimit_fsize", "10",
		"--disable_clone_newnet",
		"--really_quiet",
		"--cwd", workDir,
		"-R", fmt.Sprintf("%s:%s", workDir, workDir),
	}

	for _, e := range env {
		args = append(args, "--env", e)
	}

	args = append(args, "--", binaryPath)

	var stdout, stderr bytes.Buffer
	cmd := exec.CommandContext(ctx, "nsjail", args...)
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	result := &RunResult{
		Stdout: stdout.String(),
		Stderr: stderr.String(),
	}

	// nsjail is the parent, so rusage reflects nsjail overhead.
	// Still capture it — it's a reasonable upper bound.
	if cmd.ProcessState != nil {
		result.PeakMemoryKB = peakMemoryKB(cmd.ProcessState)
	}

	if ctx.Err() == context.DeadlineExceeded {
		result.TimedOut = true
		return result, nil
	}

	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			result.ExitCode = exitErr.ExitCode()
			// nsjail enforces rlimit_as at the kernel level.
			// When exceeded, the child receives SIGKILL (exit code 137).
			if result.ExitCode == 137 && memoryMB > 0 {
				result.MemoryExceeded = true
				return result, nil
			}
		} else {
			return nil, fmt.Errorf("nsjail execute: %w", err)
		}
	}

	return result, nil
}

// peakMemoryKB extracts peak RSS from the process's resource usage.
// Linux ru_maxrss is in kilobytes.
func peakMemoryKB(state *os.ProcessState) int64 {
	rusage, ok := state.SysUsage().(*syscall.Rusage)
	if !ok || rusage == nil {
		return 0
	}
	return rusage.Maxrss
}
