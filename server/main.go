package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"simdojo/judge/internal/auth"
	"simdojo/judge/internal/config"
	"simdojo/judge/internal/db"
	"simdojo/judge/internal/handler"
	"simdojo/judge/internal/judge"
	"simdojo/judge/internal/migrate"
	"simdojo/judge/internal/problems"
)

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	if err := run(); err != nil {
		slog.Error("fatal", "error", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	if cfg.DevMode {
		slog.Info("running in dev mode")
	}

	// Run migrations
	if err := migrate.Run(cfg.DatabaseURL); err != nil {
		return fmt.Errorf("run migrations: %w", err)
	}

	// Connect to database
	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("connect to database: %w", err)
	}
	defer pool.Close()

	// Load problems from disk
	problemsDir := "problems"
	if !cfg.DevMode {
		execPath, err := os.Executable()
		if err != nil {
			return fmt.Errorf("resolve executable path: %w", err)
		}
		problemsDir = filepath.Join(filepath.Dir(execPath), "problems")
	}

	store := problems.NewStore(problemsDir)
	if err := store.Load(); err != nil {
		return fmt.Errorf("load problems: %w", err)
	}
	if err := store.SyncToDB(ctx, pool); err != nil {
		return fmt.Errorf("sync problems to db: %w", err)
	}

	// Auth middleware
	authMW, err := auth.NewMiddleware(cfg.ClerkIssuerURL)
	if err != nil {
		return fmt.Errorf("init auth middleware: %w", err)
	}

	// Handlers
	problemsH := handler.NewProblemsHandler(store)
	j := judge.New(pool, store, cfg.DevMode, cfg.ExtraCompileFlags)
	submissionsH := handler.NewSubmissionsHandler(pool, j)

	// Router
	r := chi.NewRouter()
	r.Use(slogRequestLogger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.FrontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public routes
	r.Get("/api/health", handler.Health)
	r.Get("/api/problems", problemsH.List)
	r.Get("/api/problems/{id}", problemsH.Get)

	// Authenticated routes
	r.Group(func(r chi.Router) {
		r.Use(authMW.Require)
		r.Post("/api/submit", submissionsH.Submit)
		r.Post("/api/run", submissionsH.Run)
	})

	// Start server
	addr := fmt.Sprintf(":%d", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		slog.Info("server starting", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		return fmt.Errorf("server failed: %w", err)
	case <-quit:
	}

	slog.Info("shutting down server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}

// slogRequestLogger is a chi middleware that logs requests via slog instead of the default log package.
func slogRequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := chimw.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r)
		slog.Info("http request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", ww.Status(),
			"duration_ms", time.Since(start).Milliseconds(),
			"bytes", ww.BytesWritten(),
		)
	})
}
