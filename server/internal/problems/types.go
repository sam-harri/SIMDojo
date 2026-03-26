package problems

type ProblemConfig struct {
	ID               string `toml:"id"`
	Title            string `toml:"title"`
	Difficulty       string `toml:"difficulty"`
	Order            int    `toml:"order"`
	CompileFlags     string `toml:"compile_flags"`
	TimeLimitSeconds int    `toml:"time_limit_seconds"`
	MemoryLimitMB    int    `toml:"memory_limit_mb"`
}

type Problem struct {
	Config      ProblemConfig
	Description string // markdown content
	StarterCode string
	// Solution and harness are on disk only — never served to users
}
