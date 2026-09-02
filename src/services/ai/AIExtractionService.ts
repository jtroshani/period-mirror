/**
 * AI extraction service — turns a natural-language "How do I feel today?"
 * message into reviewable structured items.
 *
 * SCOPE (important): this service structures and recognises information the
 * user describes. It does NOT diagnose, name conditions, or recommend
 * treatment. A real model API can be dropped in behind this interface later
 * (see `createAIExtractionService`); nothing else in the app changes.
 */

import type {
  BleedingLevel,
  ExtractedItem,
  IsoDate,
  SafetyNotice,
} from "@/models";

export interface AIExtractionRequest {
  text: string;
  date: IsoDate;
  /** Optional personal context so "heavier than usual" can be resolved. */
  context?: {
    recentBleedingLevel?: BleedingLevel;
    typicalEarlyPeriodPain?: number;
  };
}

export interface AIExtractionResult {
  items: ExtractedItem[];
  /** Present only when wording warranted a non-diagnostic safety reminder. */
  safety?: SafetyNotice;
  /** Shown in the UI for transparency about what did the extraction. */
  modelLabel: string;
}

export interface AIExtractionService {
  /** False for the prototype's on-device heuristic extractor. */
  readonly isRealModel: boolean;
  readonly modelLabel: string;
  extract(request: AIExtractionRequest): Promise<AIExtractionResult>;
}
