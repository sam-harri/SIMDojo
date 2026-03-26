-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "schema_migrations" (
	"version" bigint PRIMARY KEY NOT NULL,
	"dirty" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_account" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_account_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"kinde_id" text NOT NULL,
	"email" text NOT NULL,
	"given_name" text,
	"family_name" text,
	"picture" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_account_kinde_id_key" UNIQUE("kinde_id"),
	CONSTRAINT "user_account_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "submission_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"problem_id" bigint NOT NULL,
	"language" text DEFAULT 'cpp' NOT NULL,
	"code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"tests_passed" integer DEFAULT 0 NOT NULL,
	"tests_total" integer DEFAULT 0 NOT NULL,
	"exec_time_ns" bigint,
	"scalar_time_ns" bigint,
	"speedup" real,
	"compiler_output" text,
	"runtime_output" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_language_check" CHECK (language = 'cpp'::text),
	CONSTRAINT "submission_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'compiling'::text, 'running'::text, 'accepted'::text, 'wrong_answer'::text, 'compile_error'::text, 'runtime_error'::text, 'time_limit'::text, 'memory_limit'::text]))
);
--> statement-breakpoint
CREATE TABLE "problem" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "problem_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"difficulty" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "problem_slug_key" UNIQUE("slug"),
	CONSTRAINT "problem_difficulty_check" CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))
);
--> statement-breakpoint
CREATE TABLE "problem_completion" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "problem_completion_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"problem_id" bigint NOT NULL,
	"first_solved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"best_speedup" real,
	"best_submission_id" bigint,
	CONSTRAINT "problem_completion_user_id_problem_id_key" UNIQUE("user_id","problem_id")
);
--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_completion" ADD CONSTRAINT "problem_completion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_completion" ADD CONSTRAINT "problem_completion_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_completion" ADD CONSTRAINT "problem_completion_best_submission_id_fkey" FOREIGN KEY ("best_submission_id") REFERENCES "public"."submission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submission_created_at_idx" ON "submission" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "submission_problem_id_idx" ON "submission" USING btree ("problem_id" int8_ops);--> statement-breakpoint
CREATE INDEX "submission_user_id_idx" ON "submission" USING btree ("user_id" int8_ops);--> statement-breakpoint
CREATE INDEX "submission_user_problem_idx" ON "submission" USING btree ("user_id" int8_ops,"problem_id" int8_ops);--> statement-breakpoint
CREATE INDEX "problem_completion_problem_id_idx" ON "problem_completion" USING btree ("problem_id" int8_ops);--> statement-breakpoint
CREATE INDEX "problem_completion_user_id_idx" ON "problem_completion" USING btree ("user_id" int8_ops);
*/