import { relations } from "drizzle-orm/relations";
import { problem, submission, problemCompletion } from "./schema";

export const submissionRelations = relations(submission, ({one, many}) => ({
	problem: one(problem, {
		fields: [submission.problemId],
		references: [problem.id]
	}),
	problemCompletions: many(problemCompletion),
}));

export const problemRelations = relations(problem, ({many}) => ({
	submissions: many(submission),
	problemCompletions: many(problemCompletion),
}));

export const problemCompletionRelations = relations(problemCompletion, ({one}) => ({
	problem: one(problem, {
		fields: [problemCompletion.problemId],
		references: [problem.id]
	}),
	submission: one(submission, {
		fields: [problemCompletion.bestSubmissionId],
		references: [submission.id]
	}),
}));