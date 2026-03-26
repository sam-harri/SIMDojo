package config

import (
	"github.com/caarlos0/env/v11"
)

type Config struct {
	DatabaseURL       string `env:"DATABASE_URL,required"`
	ClerkIssuerURL    string `env:"CLERK_ISSUER_URL,required"`
	Port              int    `env:"PORT" envDefault:"8080"`
	DevMode           bool   `env:"DEV_MODE" envDefault:"false"`
	FrontendURL       string `env:"FRONTEND_URL" envDefault:"http://localhost:3000"`
	ExtraCompileFlags string `env:"EXTRA_COMPILE_FLAGS" envDefault:""`
}

func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
