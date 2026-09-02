/**
 * On-device heuristic extractor (prototype). Pattern-matches the user's words
 * into reviewable items. No network, no model, no diagnosis. Kept isolated so
 * a real model adapter can replace it without touching the UI.
 */

import type {
  ActivityLevel,
  BleedingLevel,
  EnergyLevel,
  ExtractedItem,
  Mood,
  PainLocation,
  SleepQuality,
  SymptomType,
} from "@/models";
import { uid } from "@/utils/id";
import { clamp } from "@/utils/statistics";
import { evaluateCheckInText } from "@/engine/safety/safetyEngine";
import type {
  AIExtractionRequest,
  AIExtractionResult,
  AIExtractionService,
} from "./AIExtractionService";

const PAIN_RE =
  /\b(pain|cramp(?:s|ing)?|ache|aching|hurts?|sore|tender(?:ness)?|throbbing|stabbing)\b/i;

const LOCATION_RULES: { loc: PainLocation; re: RegExp }[] = [
  { loc: "right_side", re: /\b(right side|right (?:lower )?(?:abdomen|ovary|hip|pelvis)|on (?:my )?right)\b/i },
  { loc: "left_side", re: /\b(left side|left (?:lower )?(?:abdomen|ovary|hip|pelvis)|on (?:my )?left)\b/i },
  { loc: "lower_back", re: /\b(lower back|back ache|back pain|back hurts)\b/i },
  { loc: "headache", re: /\b(head ?ache|migraine|head hurts|behind (?:my )?eyes)\b/i },
  { loc: "breasts", re: /\b(breasts?|boobs?)\b/i },
  { loc: "lower_abdomen", re: /\b(lower abdomen|abdomen|belly|stomach|tummy|pelvic|pelvis|uterus)\b/i },
];

const SEVERITY_WORDS: { re: RegExp; level: number }[] = [
  { re: /\b(excruciating|unbearable|worst (?:pain|ever))\b/i, level: 10 },
  { re: /\b(severe|terrible|awful|really bad|intense)\b/i, level: 8 },
  { re: /\b(bad|strong|sharp|pretty painful)\b/i, level: 7 },
  { re: /\b(moderate|noticeable|uncomfortable)\b/i, level: 5 },
  { re: /\b(mild|slight|a little|minor|dull)\b/i, level: 3 },
];

const MOOD_RULES: { mood: Mood; re: RegExp }[] = [
  { mood: "anxious", re: /\b(anxious|anxiety|on edge|panicky|nervous|worried)\b/i },
  { mood: "low", re: /\b(sad|down|low mood|feeling low|tearful|crying|cried|blue|flat)\b/i },
  { mood: "irritable", re: /\b(irritable|irritated|snappy|grumpy|frustrated|short[- ]tempered)\b/i },
  { mood: "emotional", re: /\b(emotional|weepy|all over the place|sensitive)\b/i },
  { mood: "calm", re: /\b(calm|relaxed|settled|at peace)\b/i },
  { mood: "happy", re: /\b(happy|cheerful|good mood|great mood|upbeat)\b/i },
];

const SYMPTOM_RULES: { type: SymptomType; re: RegExp }[] = [
  { type: "cramps", re: /\bcramp/i },
  { type: "headache", re: /\b(head ?ache|migraine)\b/i },
  { type: "bloating", re: /\bbloat/i },
  { type: "nausea", re: /\b(nause|feel sick|queasy|sick to my stomach)\b/i },
  { type: "breast_tenderness", re: /\b(breasts?|boobs?)\b.*\b(tender|sore|hurt|ache)\b|\b(sore|tender) (?:breasts?|boobs?)\b/i },
  { type: "acne", re: /\b(acne|breakout|break(?:ing)? out|pimple|spots on my (?:face|skin))\b/i },
  { type: "fatigue", re: /\b(fatigue|exhaust(?:ed|ion)|no energy|drained|wiped out)\b/i },
  { type: "dizziness", re: /\b(dizz|light[- ]?headed|vertigo)\b/i },
  { type: "digestive_changes", re: /\b(diarr?ho?ea|constipat|loose stool|bowel|gassy)\b/i },
  { type: "cravings", re: /\b(crav(?:ing|e)|want(?:ing)? (?:chocolate|sugar|carbs|salt))\b/i },
  { type: "back_pain", re: /\b(back (?:pain|ache)|back hurts)\b/i },
];

const HEAVIER_RE = /\b(heav(?:y|ier)|soak|flooding|gushing)\b/i;
const LIGHTER_RE = /\b(light(?:er)?|barely bleeding|hardly any)\b/i;
const SPOTTING_RE = /\b(spot(?:ting|s|ted)?|brown discharge|pink discharge)\b/i;
const PERIOD_START_RE = /\b(period (?:started|began|arrived|came)|started (?:my )?period|on my period|first day)\b/i;
const CLOTS_RE = /\bclots?\b/i;

const ENERGY_LOW_STRONG = /\b(exhausted|completely drained|no energy at all|wiped out|can barely move)\b/i;
const ENERGY_LOW = /\b(tired|fatigued?|drained|sleepy|lethargic|sluggish|worn out|low energy)\b/i;
const ENERGY_HIGH = /\b(energetic|lots of energy|full of energy|great energy|really active)\b/i;

const SLEEP_HOURS_RE = /\b(?:slept|got)\s*(?:for|about|around)?\s*(\d{1,2})(?:\.5|\s*and a half)?\s*(?:h(?:ours?|rs?)?|hrs)\b/i;
const SLEEP_HOURS_ALT_RE = /\b(\d{1,2})(?:\.5)?\s*hours?(?:\s*of)?\s*sleep\b/i;
const SLEEP_POOR_RE = /\b(didn'?t sleep|couldn'?t sleep|no sleep|insomnia|barely slept|kept waking|restless night|slept badly|bad night'?s sleep|awful sleep|tossed and turned)\b/i;
const SLEEP_GOOD_RE = /\b(slept well|good sleep|slept great|solid sleep|deep sleep)\b/i;

const ACTIVITY_HIGH_RE = /\b(worked out|went for a run|ran \d|hit the gym|exercised hard|long run|hard workout|long hike)\b/i;
const ACTIVITY_MOD_RE = /\b(walk|walked|yoga|light workout|stretch|swim|cycled|bike ride|gym)\b/i;
const ACTIVITY_LOW_RE = /\b(rested all day|didn'?t move|stayed in bed|no exercise|couch all day|didn'?t leave the house)\b/i;

function item(
  partial: Omit<ExtractedItem, "id" | "accepted"> & { accepted?: boolean },
): ExtractedItem {
  return { id: uid("item"), accepted: partial.accepted ?? true, ...partial };
}

function detectPain(text: string): ExtractedItem | null {
  if (!PAIN_RE.test(text)) return null;
  const locations = LOCATION_RULES.filter((r) => r.re.test(text)).map((r) => r.loc);
  const numeric = text.match(/\b(\d{1,2})\s*(?:\/\s*10|out of 10)\b/i);
  let level: number | undefined;
  if (numeric) level = clamp(parseInt(numeric[1], 10), 0, 10);
  if (level == null) {
    for (const w of SEVERITY_WORDS) {
      if (w.re.test(text)) {
        level = w.level;
        break;
      }
    }
  }
  const descriptor = text.match(/\b(strange|weird|sharp|dull|stabbing|burning|throbbing|constant|comes and goes)\b/i);
  const locWords = locations.length
    ? locations
        .map((l) => l.replace("_", " "))
        .join(" & ")
    : undefined;
  return item({
    field: "pain",
    label: `Pain${locWords ? ` · ${locWords}` : ""}`,
    detail:
      level == null
        ? "You described pain but not how strong it was."
        : `Around ${level}/10${descriptor ? `, ${descriptor[1].toLowerCase()}` : ""}.`,
    value: {
      level,
      locations,
      note: descriptor ? `${descriptor[1].toLowerCase()} pain` : undefined,
    },
    confidence: numeric ? 0.9 : 0.78,
    needsSeverity: level == null,
    sourcePhrase: firstMatch(text, PAIN_RE),
  });
}

function detectBleeding(text: string, req: AIExtractionRequest): ExtractedItem | null {
  let level: BleedingLevel | null = null;
  let detail = "";
  if (HEAVIER_RE.test(text)) {
    level = "heavy";
    detail = /than usual|than normal|more than/i.test(text)
      ? "You said it is heavier than usual."
      : "You described heavy bleeding.";
  } else if (SPOTTING_RE.test(text)) {
    level = "spotting";
    detail = "You mentioned spotting.";
  } else if (LIGHTER_RE.test(text)) {
    level = "light";
    detail = "You described light bleeding.";
  } else if (PERIOD_START_RE.test(text)) {
    level = req.context?.recentBleedingLevel === "heavy" ? "heavy" : "medium";
    detail = "You mentioned your period.";
  }
  if (!level) return null;
  const clots = CLOTS_RE.test(text);
  return item({
    field: "bleeding",
    label: `Bleeding · ${level}${clots ? " · with clots" : ""}`,
    detail,
    value: { level, clots: clots || undefined },
    confidence: 0.8,
    sourcePhrase: firstMatch(text, HEAVIER_RE) ?? firstMatch(text, PERIOD_START_RE),
  });
}

function detectEnergy(text: string): ExtractedItem | null {
  let level: EnergyLevel | null = null;
  if (ENERGY_LOW_STRONG.test(text)) level = 1;
  else if (ENERGY_LOW.test(text)) level = 2;
  else if (ENERGY_HIGH.test(text)) level = 4;
  if (level == null) return null;
  return item({
    field: "energy",
    label: `Energy · ${level <= 2 ? "low" : "high"}`,
    detail:
      level <= 2
        ? "You mentioned feeling tired or low on energy."
        : "You mentioned having plenty of energy.",
    value: { level },
    confidence: 0.72,
    sourcePhrase:
      firstMatch(text, ENERGY_LOW_STRONG) ??
      firstMatch(text, ENERGY_LOW) ??
      firstMatch(text, ENERGY_HIGH),
  });
}

function detectMood(text: string): ExtractedItem | null {
  const moods = MOOD_RULES.filter((r) => r.re.test(text)).map((r) => r.mood);
  if (moods.length === 0) return null;
  return item({
    field: "mood",
    label: `Mood · ${moods.join(", ")}`,
    detail: "Based on the feelings you described.",
    value: { moods },
    confidence: 0.7,
  });
}

function detectSleep(text: string): ExtractedItem | null {
  const hoursMatch = text.match(SLEEP_HOURS_RE) ?? text.match(SLEEP_HOURS_ALT_RE);
  let hours: number | undefined;
  if (hoursMatch) {
    hours = clamp(parseFloat(hoursMatch[1]) + (/\.5|and a half/i.test(hoursMatch[0]) ? 0.5 : 0), 0, 16);
  }
  let quality: SleepQuality | undefined;
  if (SLEEP_POOR_RE.test(text)) quality = "poor";
  else if (SLEEP_GOOD_RE.test(text)) quality = "good";
  if (hours == null && quality == null) return null;
  return item({
    field: "sleep",
    label: `Sleep${hours != null ? ` · ${hours}h` : ""}${quality ? ` · ${quality}` : ""}`,
    detail:
      quality === "poor"
        ? "You mentioned a poor night's sleep."
        : "Based on what you said about last night.",
    value: { hours, quality },
    confidence: hours != null ? 0.85 : 0.7,
  });
}

function detectActivity(text: string): ExtractedItem | null {
  let level: ActivityLevel | null = null;
  if (ACTIVITY_HIGH_RE.test(text)) level = "high";
  else if (ACTIVITY_MOD_RE.test(text)) level = "moderate";
  else if (ACTIVITY_LOW_RE.test(text)) level = "low";
  if (!level) return null;
  return item({
    field: "activity",
    label: `Activity · ${level}`,
    detail: "Based on the movement you described.",
    value: { level },
    confidence: 0.65,
  });
}

function detectSymptoms(text: string): ExtractedItem[] {
  const seen = new Set<SymptomType>();
  const out: ExtractedItem[] = [];
  for (const rule of SYMPTOM_RULES) {
    if (seen.has(rule.type) || !rule.re.test(text)) continue;
    seen.add(rule.type);
    out.push(
      item({
        field: "symptom",
        label: `Symptom · ${rule.type.replace(/_/g, " ")}`,
        value: { type: rule.type },
        confidence: 0.75,
        sourcePhrase: firstMatch(text, rule.re),
      }),
    );
  }
  return out;
}

function firstMatch(text: string, re: RegExp): string | undefined {
  const m = text.match(re);
  return m ? m[0] : undefined;
}

export class MockAIExtractionService implements AIExtractionService {
  readonly isRealModel = false;
  readonly modelLabel = "On-device pattern matcher (prototype)";

  async extract(request: AIExtractionRequest): Promise<AIExtractionResult> {
    const text = request.text.trim();
    // Small delay so the UI can show a natural "reading your words" state.
    await new Promise((r) => setTimeout(r, 550));

    const items: ExtractedItem[] = [];
    const pain = detectPain(text);
    if (pain) items.push(pain);
    const bleeding = detectBleeding(text, request);
    if (bleeding) items.push(bleeding);
    const energy = detectEnergy(text);
    if (energy) items.push(energy);
    const mood = detectMood(text);
    if (mood) items.push(mood);
    const sleep = detectSleep(text);
    if (sleep) items.push(sleep);
    const activity = detectActivity(text);
    if (activity) items.push(activity);
    items.push(...detectSymptoms(text));

    if (text.length > 0) {
      items.push(
        item({
          field: "note",
          label: "Save your words as a note",
          detail: "Keeps the original text with today's history.",
          value: text,
          confidence: 1,
        }),
      );
    }

    const safety = evaluateCheckInText(text, request.date) ?? undefined;
    return { items, safety, modelLabel: this.modelLabel };
  }
}
