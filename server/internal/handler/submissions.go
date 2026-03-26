package handler

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"simdojo/judge/internal/auth"
	"simdojo/judge/internal/judge"
)

type SubmissionsHandler struct {
	pool  *pgxpool.Pool
	judge *judge.Judge

	// Simple in-memory rate limiter: clerk user_id -> last action time
	rateMu      sync.Mutex
	submitLimit map[string]time.Time
	runLimit    map[string]time.Time
}

func NewSubmissionsHandler(pool *pgxpool.Pool, j *judge.Judge) *SubmissionsHandler {
	h := &SubmissionsHandler{
		pool:        pool,
		judge:       j,
		submitLimit: make(map[string]time.Time),
		runLimit:    make(map[string]time.Time),
	}
	go h.cleanupRateLimits()
	return h
}

// cleanupRateLimits periodically evicts stale rate limiter entries to prevent unbounded growth.
func (h *SubmissionsHandler) cleanupRateLimits() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		h.rateMu.Lock()
		for k, v := range h.submitLimit {
			if now.Sub(v) > 10*time.Second {
				delete(h.submitLimit, k)
			}
		}
		for k, v := range h.runLimit {
			if now.Sub(v) > 10*time.Second {
				delete(h.runLimit, k)
			}
		}
		h.rateMu.Unlock()
	}
}

type submitRequest struct {
	ProblemID string `json:"problem_id"`
	Code      string `json:"code"`
	Language  string `json:"language"`
}

// Submit creates a new submission and triggers async judging (submit mode).
func (h *SubmissionsHandler) Submit(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	// Rate limit: 1 submission per 5 seconds
	h.rateMu.Lock()
	last, exists := h.submitLimit[claims.Sub]
	if exists && time.Since(last) < 5*time.Second {
		h.rateMu.Unlock()
		writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "rate limited, wait 5 seconds between submissions"})
		return
	}
	h.submitLimit[claims.Sub] = time.Now()
	h.rateMu.Unlock()

	h.createAndJudge(w, r, claims.Sub, "submit")
}

// Run creates a new submission and triggers async judging (run mode, sample tests only).
func (h *SubmissionsHandler) Run(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	// Rate limit: 1 run per 2 seconds
	h.rateMu.Lock()
	last, exists := h.runLimit[claims.Sub]
	if exists && time.Since(last) < 2*time.Second {
		h.rateMu.Unlock()
		writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "rate limited, wait 2 seconds between runs"})
		return
	}
	h.runLimit[claims.Sub] = time.Now()
	h.rateMu.Unlock()

	h.createAndJudge(w, r, claims.Sub, "run")
}

func (h *SubmissionsHandler) createAndJudge(w http.ResponseWriter, r *http.Request, userID, mode string) {
	var req submitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.ProblemID == "" || req.Code == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "problem_id and code are required"})
		return
	}

	if req.Language == "" {
		req.Language = "cpp"
	}

	// Get problem ID from slug
	var problemID int64
	err := h.pool.QueryRow(r.Context(),
		"SELECT id FROM problem WHERE slug = $1", req.ProblemID,
	).Scan(&problemID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "problem not found"})
		return
	}

	// Create submission
	var submissionID int64
	err = h.pool.QueryRow(r.Context(), `
		INSERT INTO submission (user_id, problem_id, language, code, status, mode)
		VALUES ($1, $2, $3, $4, 'pending', $5)
		RETURNING id
	`, userID, problemID, req.Language, req.Code, mode).Scan(&submissionID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create submission"})
		return
	}

	// Trigger async judging
	if mode == "run" {
		h.judge.Run(submissionID, req.ProblemID, req.Code)
	} else {
		h.judge.Submit(submissionID, req.ProblemID, req.Code)
	}

	writeJSON(w, http.StatusAccepted, map[string]any{
		"submission_id": submissionID,
	})
}
