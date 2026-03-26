package auth

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jws"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

type contextKey string

const UserClaimsKey contextKey = "user_claims"

// Claims extracted from a validated Clerk JWT.
type Claims struct {
	Sub string // Clerk user ID, e.g. "user_2abc123"
}

type Middleware struct {
	issuerURL string
	jwksURL   string
	cache     *jwk.Cache
}

func NewMiddleware(issuerURL string) (*Middleware, error) {
	jwksURL := strings.TrimRight(issuerURL, "/") + "/.well-known/jwks.json"

	ctx := context.Background()
	client := httprc.NewClient()
	cache, err := jwk.NewCache(ctx, client)
	if err != nil {
		return nil, fmt.Errorf("create jwk cache: %w", err)
	}

	if err := cache.Register(ctx, jwksURL); err != nil {
		return nil, fmt.Errorf("register jwks url: %w", err)
	}

	// Trigger initial fetch
	if _, err := cache.Refresh(ctx, jwksURL); err != nil {
		return nil, fmt.Errorf("initial jwks fetch from %s: %w", jwksURL, err)
	}

	slog.Info("JWKS cache initialized", "url", jwksURL)

	return &Middleware{
		issuerURL: issuerURL,
		jwksURL:   jwksURL,
		cache:     cache,
	}, nil
}

// Require returns middleware that validates the JWT and injects Claims into context.
func (m *Middleware) Require(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, err := m.validateRequest(r)
		if err != nil {
			slog.Warn("auth failed", "error", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":"unauthorized"}`))
			return
		}

		claims := extractClaims(token)
		ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Optional returns middleware that validates if present, but doesn't require auth.
func (m *Middleware) Optional(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, err := m.validateRequest(r)
		if err == nil {
			claims := extractClaims(token)
			ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
			r = r.WithContext(ctx)
		}
		next.ServeHTTP(w, r)
	})
}

func (m *Middleware) validateRequest(r *http.Request) (jwt.Token, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, fmt.Errorf("missing authorization header")
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
		return nil, fmt.Errorf("invalid authorization header format")
	}
	tokenStr := parts[1]

	keySet, err := m.cache.Lookup(r.Context(), m.jwksURL)
	if err != nil {
		return nil, fmt.Errorf("lookup jwks: %w", err)
	}

	token, err := jwt.Parse([]byte(tokenStr),
		jwt.WithKeySet(keySet, jws.WithInferAlgorithmFromKey(true)),
		jwt.WithIssuer(m.issuerURL),
		jwt.WithValidate(true),
	)
	if err != nil {
		return nil, fmt.Errorf("parse/validate jwt: %w", err)
	}

	return token, nil
}

func extractClaims(token jwt.Token) *Claims {
	c := &Claims{}
	if sub, ok := token.Subject(); ok {
		c.Sub = sub
	}
	return c
}

// GetClaims extracts claims from the request context.
func GetClaims(ctx context.Context) *Claims {
	if c, ok := ctx.Value(UserClaimsKey).(*Claims); ok {
		return c
	}
	return nil
}
