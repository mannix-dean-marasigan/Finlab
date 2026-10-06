/**
 * FUTURE AI MODULES — intentionally NOT implemented in Phase 1.
 *
 * No AI provider is called and no AI keys exist anywhere in this codebase.
 * These interfaces document the seams where AI can plug in later:
 *
 *  - AI Judge: writes a `challenge_scores` row with scorer_type = 'ai' and calls
 *    `finalize_submission_score` from a server-side Edge Function (service role).
 *    The UI already renders scores of any scorer_type, so no page changes.
 *  - AI Research Coach / Mentor: read-only feedback on drafts (stock_pitches,
 *    research_sections) surfaced next to the editor.
 *  - AI Investment Committee: generates Q&A for professional pitches.
 *  - AI Market Event Generator: inserts `market_events` (status 'draft') for
 *    admin approval.
 *
 * All AI calls must run server-side (Edge Functions) so keys never reach the
 * browser.
 */

export type ScorerType = 'auto' | 'admin' | 'ai';

export interface SubmissionEvaluator {
  readonly scorerType: ScorerType;
  /** Evaluate a submission and return criterion scores (0–max each). */
  evaluate(submissionId: string): Promise<{ criteria: { key: string; label: string; score: number; max: number; feedback?: string }[]; feedback: string }>;
}

export const AI_FEATURES_ENABLED = false as const;
