/**
 * Safety layer — configurable, non-diagnostic.
 *
 * This module NEVER decides what a symptom means. It only recognises a small
 * set of phrases / values that warrant a calm, proportionate reminder that
 * some situations need prompt attention. Messaging is restrained by design:
 * ordinary symptoms produce nothing.
 */

import type { DailyHealthEntry, IsoDate, SafetyNotice, SafetySeverity } from "@/models";
import { uid } from "@/utils/id";

export const SAFETY_MESSAGE =
  "Some symptoms can need prompt medical attention. If you are experiencing severe symptoms, feel unsafe, or think this may be an emergency, contact a healthcare professional or your local emergency service.";

interface TextRule {
  id: string;
  /** Matched case-insensitively against the raw check-in text. */
  pattern: RegExp;
  /** Short phrase echoed back so the user sees why the notice appeared. */
  phrase: string;
  severity: SafetySeverity;
}

/**
 * Editable rule table. Kept intentionally narrow — emergency-adjacent wording
 * only, not a catalogue of every uncomfortable symptom.
 */
export const SAFETY_TEXT_RULES: TextRule[] = [
  { id: "faint", pattern: /\b(faint(ed|ing)?|pass(ed)? out|blacked out|collaps(e|ed))\b/i, phrase: "fainting or passing out", severity: "attention" },
  { id: "severe-dizzy", pattern: /\b(severe|really|very|extremely)\s+dizz/i, phrase: "severe dizziness", severity: "attention" },
  { id: "cant-stand", pattern: /\b(can'?t|cannot|unable to)\s+(stand|walk|stay upright)\b/i, phrase: "not being able to stand", severity: "attention" },
  { id: "soaking", pattern: /\b(soak(ing|ed)?\s+through|flooding|changing.*(pad|tampon).*(every hour|hourly)|blood everywhere)\b/i, phrase: "very heavy bleeding", severity: "attention" },
  { id: "worst-pain", pattern: /\b(worst pain|unbearable|excruciating|10\/10 pain|pain is a 10)\b/i, phrase: "extremely severe pain", severity: "attention" },
  { id: "chest-breath", pattern: /\b(chest pain|can'?t breathe|short(ness)? of breath|trouble breathing)\b/i, phrase: "chest pain or trouble breathing", severity: "attention" },
  { id: "fever-high", pattern: /\b(high fever|fever (of )?(39|40|103|104))\b/i, phrase: "a high fever", severity: "attention" },
];

export function evaluateCheckInText(
  text: string,
  date: IsoDate,
): SafetyNotice | null {
  const matched = SAFETY_TEXT_RULES.filter((r) => r.pattern.test(text));
  if (matched.length === 0) return null;
  return {
    id: uid("safety"),
    triggeredBy: matched.map((m) => m.phrase),
    severity: "attention",
    message: SAFETY_MESSAGE,
    date,
  };
}

/**
 * Structured-entry check. Uses conservative thresholds and still only produces
 * a reminder — no interpretation of cause.
 */
export function evaluateEntry(
  entry: DailyHealthEntry,
  date: IsoDate,
): SafetyNotice | null {
  const reasons: string[] = [];
  if ((entry.pain?.level ?? 0) >= 9) reasons.push("very high recorded pain");
  if (entry.bleeding?.level === "heavy" && entry.bleeding.clots)
    reasons.push("heavy bleeding with clots");
  if (entry.symptoms.some((s) => s.type === "dizziness" && (s.severity ?? 0) >= 8))
    reasons.push("severe dizziness");
  const note = `${entry.notes ?? ""} ${entry.pain?.note ?? ""}`.trim();
  if (note) {
    const fromNote = evaluateCheckInText(note, date);
    if (fromNote) reasons.push(...fromNote.triggeredBy);
  }
  if (reasons.length === 0) return null;
  return {
    id: uid("safety"),
    triggeredBy: Array.from(new Set(reasons)),
    severity: "attention",
    message: SAFETY_MESSAGE,
    date,
  };
}
