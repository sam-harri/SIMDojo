CREATE TABLE problem (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug         TEXT NOT NULL UNIQUE,
    title        TEXT NOT NULL,
    difficulty   TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    sort_order   INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE submission (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         TEXT NOT NULL,
    problem_id      BIGINT NOT NULL REFERENCES problem(id) ON DELETE CASCADE,
    language        TEXT NOT NULL DEFAULT 'cpp' CHECK (language IN ('cpp')),
    code            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','compiling','running','accepted',
                                      'wrong_answer','compile_error','runtime_error',
                                      'time_limit','memory_limit')),
    tests_passed    INTEGER NOT NULL DEFAULT 0,
    tests_total     INTEGER NOT NULL DEFAULT 0,
    exec_time_ns    BIGINT,
    scalar_time_ns  BIGINT,
    speedup         REAL,
    compiler_output TEXT,
    runtime_output  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX submission_user_id_idx ON submission(user_id);
CREATE INDEX submission_problem_id_idx ON submission(problem_id);
CREATE INDEX submission_user_problem_idx ON submission(user_id, problem_id);
CREATE INDEX submission_created_at_idx ON submission(created_at);

CREATE TABLE problem_completion (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id            TEXT NOT NULL,
    problem_id         BIGINT NOT NULL REFERENCES problem(id) ON DELETE CASCADE,
    first_solved_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    best_speedup       REAL,
    best_submission_id BIGINT REFERENCES submission(id),
    UNIQUE (user_id, problem_id)
);
CREATE INDEX problem_completion_user_id_idx ON problem_completion(user_id);
CREATE INDEX problem_completion_problem_id_idx ON problem_completion(problem_id);
