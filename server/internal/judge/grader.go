package judge

import (
	"encoding/json"
	"fmt"
	"os"
)

// HarnessOutput is the JSON structure written to __result.json by the harness.
type HarnessOutput struct {
	Mode         string        `json:"mode"`
	TestsPassed  int           `json:"tests_passed"`
	TestsTotal   int           `json:"tests_total"`
	ExecTimeNs   *int64        `json:"exec_time_ns,omitempty"`
	Results      []TestResult  `json:"results"`
	FirstFailure *FirstFailure `json:"first_failure,omitempty"`
}

type TestResult struct {
	Name     string `json:"name"`
	Passed   bool   `json:"passed"`
	TimeNs   int64  `json:"time_ns"`
	Error    string `json:"error,omitempty"`
	Input    string `json:"input,omitempty"`
	Expected string `json:"expected,omitempty"`
	Actual   string `json:"actual,omitempty"`
}

type FirstFailure struct {
	Name     string `json:"name"`
	Expected string `json:"expected"`
	Actual   string `json:"actual"`
}

func parseHarnessOutputFile(path string) (*HarnessOutput, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read result file: %w", err)
	}
	var out HarnessOutput
	if err := json.Unmarshal(data, &out); err != nil {
		return nil, fmt.Errorf("parse harness output: %w (raw: %s)", err, truncateStr(string(data), 500))
	}
	return &out, nil
}

