"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { ZodError, z } from "zod";
import {
  actionSchema,
  answerExplanationSchema,
  requestConsiderationSchema,
  requestExplanationSchema,
  respondConsiderationSchema,
  submissionInputSchema,
  updateSubmissionSchema,
} from "@/app/api/submissions/_lib/schema";
import {
  actOnSubmission,
  answerExplanation,
  createDraft,
  deleteUnansweredSubmission,
  getSubmission,
  listConsiderationCandidates,
  requestConsideration,
  requestExplanation,
  respondToConsideration,
  resubmitRevision,
  submitDraft,
  updateSubmission,
} from "@/app/api/submissions/_lib/submission-service";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/session";

export type SubmissionActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function actionError<T>(error: unknown): SubmissionActionResult<T> {
  unstable_rethrow(error);
  if (error instanceof ZodError) return { ok: false, message: "Input tidak valid" };
  if (error instanceof AppError) return { ok: false, message: error.message };
  console.error("Submission action failed", error);
  return { ok: false, message: "Terjadi kesalahan internal" };
}

function revalidateSubmissionPaths(submissionId?: string) {
  revalidatePath("/submissions");
  revalidatePath("/dashboard");
  revalidatePath("/inbox");
  if (submissionId) revalidatePath(`/submissions/${submissionId}`);
}

export async function createDraftAction(input: unknown): Promise<SubmissionActionResult<{ id: string }>> {
  try {
    const submission = await createDraft(await requireSession(), submissionInputSchema.parse(input));
    revalidateSubmissionPaths(submission.id);
    return { ok: true, data: { id: submission.id } };
  } catch (error) {
    return actionError(error);
  }
}

export async function getSubmissionAction(submissionId: string): Promise<SubmissionActionResult<unknown>> {
  try {
    const id = z.uuid().parse(submissionId);
    return { ok: true, data: serialize(await getSubmission(await requireSession(), id)) };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteSubmissionAction(submissionId: string): Promise<SubmissionActionResult> {
  try {
    const id = z.uuid().parse(submissionId);
    await deleteUnansweredSubmission(await requireSession(), id);
    revalidateSubmissionPaths(id);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateSubmissionAction(submissionId: string, input: unknown): Promise<SubmissionActionResult> {
  try {
    const id = z.uuid().parse(submissionId);
    await updateSubmission(await requireSession(), id, updateSubmissionSchema.parse(input));
    revalidateSubmissionPaths(id);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function submitDraftAction(submissionId: string): Promise<SubmissionActionResult> {
  try {
    const id = z.uuid().parse(submissionId);
    await submitDraft(await requireSession(), id);
    revalidateSubmissionPaths(id);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function resubmitRevisionAction(submissionId: string): Promise<SubmissionActionResult> {
  try {
    const id = z.uuid().parse(submissionId);
    await resubmitRevision(await requireSession(), id);
    revalidateSubmissionPaths(id);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function decideSubmissionAction(submissionId: string, input: unknown): Promise<SubmissionActionResult> {
  try {
    const id = z.uuid().parse(submissionId);
    const action = actionSchema.parse(input);
    await actOnSubmission(await requireSession(), id, action.action, action.note);
    revalidateSubmissionPaths(id);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function getConsiderationCandidatesAction(submissionId: string): Promise<SubmissionActionResult<unknown>> {
  try {
    const id = z.uuid().parse(submissionId);
    return { ok: true, data: serialize(await listConsiderationCandidates(await requireSession(), id)) };
  } catch (error) {
    return actionError(error);
  }
}

export async function requestConsiderationAction(submissionId: string, input: unknown): Promise<SubmissionActionResult> {
  try {
    const id = z.uuid().parse(submissionId);
    const request = requestConsiderationSchema.parse(input);
    await requestConsideration(await requireSession(), id, request.recipientId, request.message);
    revalidateSubmissionPaths(id);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function respondToConsiderationAction(submissionId: string, requestId: string, input: unknown): Promise<SubmissionActionResult> {
  try {
    const id = z.uuid().parse(submissionId);
    const considerationId = z.uuid().parse(requestId);
    const response = respondConsiderationSchema.parse(input);
    await respondToConsideration(await requireSession(), id, considerationId, response.response);
    revalidateSubmissionPaths(id);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function requestExplanationAction(submissionId: string, input: unknown): Promise<SubmissionActionResult> {
  try {
    const id = z.uuid().parse(submissionId);
    const request = requestExplanationSchema.parse(input);
    await requestExplanation(await requireSession(), id, request.question);
    revalidateSubmissionPaths(id);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function answerExplanationAction(submissionId: string, requestId: string, input: unknown): Promise<SubmissionActionResult> {
  try {
    const id = z.uuid().parse(submissionId);
    const explanationId = z.uuid().parse(requestId);
    const answer = answerExplanationSchema.parse(input);
    await answerExplanation(await requireSession(), id, explanationId, answer.answer);
    revalidateSubmissionPaths(id);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}
