package problems

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sort"

	"github.com/BurntSushi/toml"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	dir      string
	problems map[string]*Problem
	ordered  []*Problem
}

func NewStore(dir string) *Store {
	return &Store{
		dir:      dir,
		problems: make(map[string]*Problem),
	}
}

// Load reads all problem directories from disk.
func (s *Store) Load() error {
	entries, err := os.ReadDir(s.dir)
	if err != nil {
		return fmt.Errorf("read problems dir %s: %w", s.dir, err)
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		p, err := s.loadProblem(filepath.Join(s.dir, entry.Name()))
		if err != nil {
			slog.Warn("skipping problem", "dir", entry.Name(), "error", err)
			continue
		}
		s.problems[p.Config.ID] = p
		slog.Info("loaded problem", "id", p.Config.ID, "title", p.Config.Title)
	}

	// Build ordered list
	s.ordered = make([]*Problem, 0, len(s.problems))
	for _, p := range s.problems {
		s.ordered = append(s.ordered, p)
	}
	sort.Slice(s.ordered, func(i, j int) bool {
		return s.ordered[i].Config.Order < s.ordered[j].Config.Order
	})

	slog.Info("problems loaded", "count", len(s.problems))
	return nil
}

func (s *Store) loadProblem(dir string) (*Problem, error) {
	// Read config
	var cfg ProblemConfig
	configPath := filepath.Join(dir, "problem.toml")
	if _, err := toml.DecodeFile(configPath, &cfg); err != nil {
		return nil, fmt.Errorf("decode %s: %w", configPath, err)
	}

	// Read markdown
	md, err := os.ReadFile(filepath.Join(dir, "problem.md"))
	if err != nil {
		return nil, fmt.Errorf("read problem.md: %w", err)
	}

	// Read starter code
	starter, err := os.ReadFile(filepath.Join(dir, "starter.cpp"))
	if err != nil {
		return nil, fmt.Errorf("read starter.cpp: %w", err)
	}

	return &Problem{
		Config:      cfg,
		Description: string(md),
		StarterCode: string(starter),
	}, nil
}

// SyncToDB upserts problem metadata into the database.
func (s *Store) SyncToDB(ctx context.Context, pool *pgxpool.Pool) error {
	for _, p := range s.problems {
		_, err := pool.Exec(ctx, `
			INSERT INTO problem (slug, title, difficulty, sort_order, tags, is_published)
			VALUES ($1, $2, $3, $4, $5, true)
			ON CONFLICT (slug) DO UPDATE SET
				title = EXCLUDED.title,
				difficulty = EXCLUDED.difficulty,
				sort_order = EXCLUDED.sort_order,
				tags = EXCLUDED.tags,
				is_published = EXCLUDED.is_published,
				updated_at = now()
		`, p.Config.ID, p.Config.Title, p.Config.Difficulty, p.Config.Order, p.Config.Tags)
		if err != nil {
			return fmt.Errorf("upsert problem %s: %w", p.Config.ID, err)
		}
	}
	slog.Info("problems synced to database")
	return nil
}

// Get returns a problem by ID.
func (s *Store) Get(id string) (*Problem, bool) {
	p, ok := s.problems[id]
	return p, ok
}

// List returns all problems ordered by sort order.
func (s *Store) List() []*Problem {
	return s.ordered
}

// Dir returns the path to a problem's directory on disk.
func (s *Store) Dir(id string) string {
	return filepath.Join(s.dir, id)
}
