package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"simdojo/judge/internal/problems"
)

type ProblemsHandler struct {
	store *problems.Store
}

func NewProblemsHandler(store *problems.Store) *ProblemsHandler {
	return &ProblemsHandler{store: store}
}

type problemListItem struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Difficulty string `json:"difficulty"`
	Order      int    `json:"order"`
}

type problemDetail struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Difficulty   string `json:"difficulty"`
	Order        int    `json:"order"`
	Description  string `json:"description"`
	StarterCode  string `json:"starter_code"`
}

// List returns all published problems (metadata only).
func (h *ProblemsHandler) List(w http.ResponseWriter, r *http.Request) {
	all := h.store.List()
	items := make([]problemListItem, 0, len(all))
	for _, p := range all {
		items = append(items, problemListItem{
			ID:         p.Config.ID,
			Title:      p.Config.Title,
			Difficulty: p.Config.Difficulty,
			Order:      p.Config.Order,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"problems": items})
}

// Get returns full problem data including markdown and starter code.
func (h *ProblemsHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, ok := h.store.Get(id)
	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "problem not found"})
		return
	}
	writeJSON(w, http.StatusOK, problemDetail{
		ID:          p.Config.ID,
		Title:       p.Config.Title,
		Difficulty:  p.Config.Difficulty,
		Order:       p.Config.Order,
		Description: p.Description,
		StarterCode: p.StarterCode,
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
