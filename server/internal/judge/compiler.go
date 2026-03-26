package judge

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
)

type CompileResult struct {
	Success bool
	Output  string // compiler stdout+stderr
	Binary  string // path to compiled binary
}

func compile(ctx context.Context, workDir, sourceFile, outputBinary, flags string) (*CompileResult, error) {
	args := []string{}
	args = append(args, strings.Fields(flags)...)
	args = append(args, "-o", outputBinary, sourceFile)

	cmd := exec.CommandContext(ctx, "clang++", args...)
	cmd.Dir = workDir

	out, err := cmd.CombinedOutput()
	if err != nil {
		return &CompileResult{
			Success: false,
			Output:  string(out),
		}, nil
	}

	return &CompileResult{
		Success: true,
		Output:  string(out),
		Binary:  outputBinary,
	}, nil
}

// checkDangerousCode does basic string-level filtering before compilation.
// nsjail is the real security layer.
func checkDangerousCode(code string) error {
	dangerous := []string{
		"<sys/socket.h>",
		"<netinet/in.h>",
		"<arpa/inet.h>",
		"<sys/ptrace.h>",
	}
	for _, d := range dangerous {
		if strings.Contains(code, d) {
			return fmt.Errorf("forbidden include: %s", d)
		}
	}

	dangerousCalls := []string{
		"system(",
		"popen(",
		"execve(",
		"execvp(",
		"execl(",
		"execlp(",
		"fork(",
	}
	for _, d := range dangerousCalls {
		if strings.Contains(code, d) {
			return fmt.Errorf("forbidden function call: %s", d)
		}
	}

	return nil
}
