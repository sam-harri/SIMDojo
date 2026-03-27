import { pgTable, unique, check, bigint, text, integer, boolean, timestamp, index, foreignKey, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const problem = pgTable("problem", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "problem_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: text().notNull(),
	title: text().notNull(),
	difficulty: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	isPublished: boolean("is_published").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	tags: text().array().default([""]).notNull(),
}, (table) => [
	unique("problem_slug_key").on(table.slug),
	check("problem_difficulty_check", sql`difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])`),
	check("problem_tags_check", sql`tags <@ ARRAY['arithmetic'::text, 'comparison'::text, 'load-store'::text, 'shuffle'::text, 'masking'::text, 'reduction'::text, 'bitwise'::text, 'branchless'::text]`),
]);

export const schemaMigrations = pgTable("schema_migrations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	version: bigint({ mode: "number" }).primaryKey().notNull(),
	dirty: boolean().notNull(),
});

export const submission = pgTable("submission", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "submission_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: text("user_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	problemId: bigint("problem_id", { mode: "number" }).notNull(),
	language: text().default('cpp').notNull(),
	code: text().notNull(),
	status: text().default('pending').notNull(),
	testsPassed: integer("tests_passed").default(0).notNull(),
	testsTotal: integer("tests_total").default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	execTimeNs: bigint("exec_time_ns", { mode: "number" }),
	compilerOutput: text("compiler_output"),
	runtimeOutput: text("runtime_output"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	mode: text().default('submit').notNull(),
	testResults: jsonb("test_results"),
	firstFailure: jsonb("first_failure"),
	programOutput: text("program_output"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	peakMemoryKb: bigint("peak_memory_kb", { mode: "number" }),
}, (table) => [
	index("submission_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("submission_problem_id_idx").using("btree", table.problemId.asc().nullsLast().op("int8_ops")),
	index("submission_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("submission_user_problem_idx").using("btree", table.userId.asc().nullsLast().op("int8_ops"), table.problemId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.problemId],
			foreignColumns: [problem.id],
			name: "submission_problem_id_fkey"
		}).onDelete("cascade"),
	check("submission_language_check", sql`language = 'cpp'::text`),
	check("submission_status_check", sql`status = ANY (ARRAY['pending'::text, 'compiling'::text, 'running'::text, 'accepted'::text, 'wrong_answer'::text, 'compile_error'::text, 'runtime_error'::text, 'time_limit'::text, 'memory_limit'::text, 'internal_error'::text])`),
]);

export const problemCompletion = pgTable("problem_completion", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "problem_completion_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: text("user_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	problemId: bigint("problem_id", { mode: "number" }).notNull(),
	firstSolvedAt: timestamp("first_solved_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	bestSubmissionId: bigint("best_submission_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	bestExecTimeNs: bigint("best_exec_time_ns", { mode: "number" }),
}, (table) => [
	index("problem_completion_problem_id_idx").using("btree", table.problemId.asc().nullsLast().op("int8_ops")),
	index("problem_completion_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.problemId],
			foreignColumns: [problem.id],
			name: "problem_completion_problem_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.bestSubmissionId],
			foreignColumns: [submission.id],
			name: "problem_completion_best_submission_id_fkey"
		}),
	unique("problem_completion_user_id_problem_id_key").on(table.userId, table.problemId),
]);
