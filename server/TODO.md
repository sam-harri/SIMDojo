SimDojo Go Server -- Code Review
Context
Deep review of the server/ Go codebase (~800 lines, 15 files) for correctness, idiomatic Go, composition, and overall quality. The server is a competitive programming judge that compiles/executes C++ submissions, grades them, and tracks user progress via PostgreSQL.

Overall impression: The codebase is clean, well-structured, and surprisingly tight for its scope. Good separation of concerns with internal/ packages, proper use of slog, solid graceful shutdown, embedded migrations, and defense-in-depth security. The issues below are refinements, not rewrites.

Priority 1: Bugs & Correctness
1.1 rows.Err() never checked after iteration
File: users.go -- four for rows.Next() loops (lines 48, 67, 100, 127)
If the DB connection drops mid-iteration, the error is silently lost and partial data is returned as if complete
Fix: After every loop, add if err := rows.Err(); err != nil { writeJSON(w, 500, ...); return }
1.2 Silent continue on scan errors
File: users.go lines 50, 70, 103, 130
Scan failures (schema mismatch, type error) are swallowed. These are real bugs that should surface.
Fix: At minimum slog.Error the scan error. Ideally return 500.
1.3 Non-atomic two-step status update
File: judge.go lines 235-241
updateStatus calls updateStatusFull then conditionally issues a second pool.Exec for errMsg. Crash between the two leaves partial state.
Fix: Fold errMsg into updateStatusFull — pass it as runtimeOutput before the single call.
1.4 Broken problem_completion upsert
File: judge.go lines 209-218
WHEN EXCLUDED.best_submission_id IS NOT NULL is always true (comes from s.id), so best_submission_id is always overwritten, not actually tracking "best". best_speedup is never set.
Fix: Either compare exec times to determine actual best, or simplify to always update and add a TODO.
1.5 Misleading ctx parameter on Submit/Run
File: judge.go lines 34, 44
Both accept ctx but use context.Background() inside the goroutine. The handler passes r.Context() which would cancel after response.
Fix: Remove the ctx parameter — it's intentionally unused. Makes the API honest.
1.6 Unbounded rate limiter maps (memory leak)
File: submissions.go lines 19-22
submitLimit and runLimit maps grow forever — every unique user_id is added, never evicted.
Fix: Add a periodic cleanup goroutine that sweeps entries older than the rate window, or use a TTL cache.
Priority 2: Design & Architecture
2.1 No concurrency limit on judge goroutines
File: judge.go lines 35, 45
Every submission spawns an unbounded goroutine for compilation + execution. Under load this is dangerous.
Fix: Add a semaphore (golang.org/x/sync/semaphore) capped at e.g. runtime.NumCPU().
2.2 Handlers do raw SQL (no repository pattern)
Files: submissions.go lines 102-116, users.go throughout
These handlers hold *pgxpool.Pool directly and embed SQL. The codebase already has the right pattern in problems.Store.
Fix: Extract submissions and users repository types. Handlers call methods, not SQL.
2.3 problems.Store not thread-safe
File: loader.go lines 15-19
The map/slice have no synchronization. Safe today (Load runs once at startup) but fragile.
Fix: Add a comment documenting the invariant, or protect with sync.RWMutex.
Priority 3: Idiomatic Go
3.1 main() should delegate to run() error
File: main.go -- six slog.Error + os.Exit(1) sites
Fix: Extract func run() error, single exit point in main(). Also makes integration testing possible.
3.2 Type assertion hack for time formatting
File: users.go lines 102-108, 127-134
Scanning into any then asserting interface{ Format(string) string }. pgx scans into time.Time natively.
Fix: Scan directly into time.Time.
3.3 Duplicate truncate functions
Files: judge.go:303 (truncateStr) and grader.go:47 (truncate)
Fix: Keep one, delete the other.
3.4 Auth middleware returns text/plain error
File: auth.go line 65
Uses http.Error() which sets Content-Type: text/plain. Every other endpoint returns application/json.
Fix: Set Content-Type to application/json and write the JSON body directly.
Priority 4: Database / Migrations
4.1 Dead schema columns
scalar_time_ns, speedup (submission table) and best_speedup (problem_completion) are defined but never written
users.go:86 SELECTs s.speedup which is always NULL
Fix: Either implement speedup calculation in the judge, or drop columns via new migration.
4.2 rewriteScheme uses magic numbers
File: migrate.go lines 37-44
url[:13] and url[:11] instead of strings.HasPrefix + strings.TrimPrefix
Fix: Use the strings functions — clearer and less error-prone.
Priority 5: Minor
Alignment: grader.go:24 — Input field has inconsistent tab alignment
Ignored error: main.go:58 — execPath, _ := os.Executable() discards error
Chi Logger: main.go:87 — chimw.Logger uses log.Printf, not slog. Write a small slog-based middleware for consistency.
writeJSON trailing newline: json.NewEncoder(w).Encode() adds \n. Consider using json.Marshal + w.Write, or update Health() to use writeJSON too.
Suggested Fix Ordering
1.1 + 1.2 — rows.Err and scan errors (smallest change, highest correctness impact)
1.3 — Merge updateStatus into single DB call
1.4 — Fix problem_completion upsert logic
1.5 — Remove misleading ctx parameter
2.1 — Add semaphore to judge goroutines
1.6 — Rate limiter cleanup
3.1–3.4 — Idiomatic Go cleanup batch
4.1 — Dead columns (needs product decision)
Everything else — Opportunistic
Verification
go build ./... after each change
go vet ./... for correctness
Manual test: POST /api/submit, GET /api/users/me/stats
Check DB state after submission to verify atomic updates and completion tracking