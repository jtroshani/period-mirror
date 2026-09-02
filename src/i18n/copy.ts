/**
 * Localises the baseline/insight/report engine's human-readable output.
 * The engine keeps emitting English + structured fields; this rebuilds the
 * text per language from those fields so nothing in `src/engine` needs a
 * `lang` parameter. English generally returns wording equivalent to the
 * engine's own.
 */
import type {
  BaselineReadiness,
  BaselineTrend,
  Lang,
  MetricComparison,
} from "@/models";
import { round } from "@/utils/statistics";
import { fmtHours } from "./format";

/* --------------------------------------------------------- metric labels */

const METRIC_LABEL: Record<Lang, Record<string, string>> = {
  en: {
    early_period_pain: "pain during this period",
    period_sleep: "sleep during your period",
    energy: "energy this cycle",
    heavy_days: "heavy days this period",
    cycle_length: "most recent cycle length",
  },
  it: {
    early_period_pain: "dolore durante le mestruazioni",
    period_sleep: "sonno durante le mestruazioni",
    energy: "energia di questo ciclo",
    heavy_days: "giorni abbondanti di queste mestruazioni",
    cycle_length: "durata del ciclo più recente",
  },
};

export function metricLabel(lang: Lang, metric: string): string {
  return METRIC_LABEL[lang][metric] ?? METRIC_LABEL.en[metric] ?? metric;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* --------------------------------------------------------- comparisons */

function dirWord(cmp: MetricComparison): string {
  if (cmp.direction === "higher") return "higher than";
  if (cmp.direction === "lower") return "lower than";
  return "close to";
}

/** Italian summary with correct gender/number agreement per metric. */
function comparisonSummaryIt(cmp: MetricComparison): string {
  const dir = cmp.direction;
  switch (cmp.metric) {
    case "early_period_pain": {
      const w = dir === "higher" ? "più alto" : dir === "lower" ? "più basso" : "in linea";
      return `Il dolore che hai registrato nei primi giorni di queste mestruazioni è ${w} rispetto al tuo andamento recente.`;
    }
    case "period_sleep": {
      const w = dir === "higher" ? "più alto" : dir === "lower" ? "più basso" : "in linea";
      return `Il tuo sonno durante queste mestruazioni è stato ${w} rispetto alla tua media recente.`;
    }
    case "energy": {
      const w = dir === "higher" ? "più alta" : dir === "lower" ? "più bassa" : "in linea";
      return `L'energia che hai registrato in questo ciclo è ${w} rispetto al tuo livello abituale.`;
    }
    case "heavy_days":
      return `Hai registrato più giorni come abbondanti in queste mestruazioni rispetto ai tuoi cicli recenti.`;
    case "cycle_length": {
      const w = dir === "higher" ? "più lungo" : dir === "lower" ? "più corto" : "in linea";
      return `Il tuo ciclo più recente è stato ${w} rispetto alla durata media recente.`;
    }
    default:
      return `Questo si discosta dal tuo andamento abituale.`;
  }
}

export function comparisonSummary(lang: Lang, cmp: MetricComparison): string {
  if (lang === "it") return comparisonSummaryIt(cmp);
  const d = dirWord(cmp);
  switch (cmp.metric) {
    case "early_period_pain":
      return `Your recorded pain during the first days of this period is ${d} your recent pattern.`;
    case "period_sleep":
      return `Your sleep during this period has been ${d} your recent average.`;
    case "energy":
      return `Your recorded energy this cycle is ${d} your usual level.`;
    case "heavy_days":
      return `You've recorded more days as heavy this period than your recent cycles.`;
    case "cycle_length":
      return `Your most recent cycle was ${d} your recent average length.`;
    default:
      return `This is ${d} your usual pattern.`;
  }
}

export function comparisonExplanation(lang: Lang, cmp: MetricComparison): string {
  const n = cmp.basisCycles;
  const c = cmp.currentValue;
  const b = cmp.baselineValue;

  if (cmp.confidence === "insufficient" || c == null || b == null) {
    return lang === "it"
      ? `Serve un po' più di storico prima di confrontare ${metricLabel(lang, cmp.metric)} in modo affidabile.`
      : `We need a little more history before comparing ${metricLabel(lang, cmp.metric)} reliably.`;
  }

  if (lang === "it") {
    switch (cmp.metric) {
      case "early_period_pain":
        return `Nei tuoi ${n} cicli precedenti, il dolore medio registrato nei giorni 1–3 era ${round(b, 1)}/10. In questo ciclo, la media dei giorni 1–3 che hai registrato è ${round(c, 1)}/10.`;
      case "period_sleep":
        return `Il sonno nelle notti delle mestruazioni negli ultimi ${n} cicli era in media ${fmtHours("it", b)}. In questo ciclo è in media ${fmtHours("it", c)}.`;
      case "energy":
        return `La tua energia tipica registrata è ${round(b, 1)}/5 (su ${n} cicli di dati). In questo ciclo la media è ${round(c, 1)}/5.`;
      case "heavy_days":
        return `I tuoi ultimi ${n} cicli avevano in media ${round(b, 1)} giorno/i registrati come abbondanti. In questo ciclo ne hai registrati ${round(c, 0)} finora.`;
      case "cycle_length":
        return `I tuoi ${n} cicli precedenti erano in media ${round(b, 1)} giorni. Il tuo ultimo ciclo completato è stato ${round(c, 0)} giorni.`;
      default:
        return `Questo ciclo: ${round(c, 1)}. Il tuo solito: ${round(b, 1)} (su ${n} cicli).`;
    }
  }

  switch (cmp.metric) {
    case "early_period_pain":
      return `Across your previous ${n} cycles, your average recorded pain during Days 1–3 was ${round(b, 1)}/10. During this cycle, the average of the Days 1–3 you recorded is ${round(c, 1)}/10.`;
    case "period_sleep":
      return `Your period-night sleep across your last ${n} cycles averaged ${fmtHours("en", b)}. This cycle it is averaging ${fmtHours("en", c)}.`;
    case "energy":
      return `Your typical recorded energy is ${round(b, 1)}/5 (from ${n} cycles of data). This cycle you are averaging ${round(c, 1)}/5.`;
    case "heavy_days":
      return `Your last ${n} cycles had on average ${round(b, 1)} day(s) recorded as heavy. This cycle you have recorded ${round(c, 0)} so far.`;
    case "cycle_length":
      return `Your previous ${n} cycles averaged ${round(b, 1)} days. Your most recent completed cycle was ${round(c, 0)} days.`;
    default:
      return `This cycle: ${round(c, 1)}. Your usual: ${round(b, 1)} (from ${n} cycles).`;
  }
}

export type DisplayCategory = "NORMAL" | "NOTICE" | "TREND" | "INSUFFICIENT_DATA";

export function comparisonCategory(cmp: MetricComparison): DisplayCategory {
  if (cmp.confidence === "insufficient") return "INSUFFICIENT_DATA";
  if (cmp.direction === "similar" || cmp.severity === "none") return "NORMAL";
  return "NOTICE";
}

const GUIDANCE_METRICS = new Set(["early_period_pain", "heavy_days", "cycle_length"]);

export function comparisonGuidance(lang: Lang, cmp: MetricComparison): string | undefined {
  if (comparisonCategory(cmp) !== "NOTICE" || !GUIDANCE_METRICS.has(cmp.metric)) return undefined;
  return lang === "it"
    ? "Se questo cambiamento continua, peggiora o ti preoccupa, valuta di parlarne con un professionista sanitario."
    : "If this change continues, becomes severe, or concerns you, consider discussing it with a healthcare professional.";
}

export function comparisonInsightTitle(lang: Lang, cmp: MetricComparison): string {
  const label = metricLabel(lang, cmp.metric);
  const cat = comparisonCategory(cmp);
  if (lang === "it") {
    if (cat === "INSUFFICIENT_DATA") return `Sto ancora imparando: ${label}`;
    if (cat === "NORMAL") return `${cap(label)} nella tua norma`;
    return `Diverso dal tuo solito — ${label}`;
  }
  if (cat === "INSUFFICIENT_DATA") return `Still learning your ${label}`;
  if (cat === "NORMAL") return `${cap(label)} is within your usual range`;
  return `Different from your usual — ${label}`;
}

/* --------------------------------------------------------- trends */

// Feminine subjects in Italian → "aumentata"/"diminuita".
const IT_TREND_FEMININE = new Set(["cycle_length", "energy"]);

export function trendSummary(lang: Lang, t: BaselineTrend): string {
  const label = trendMetricLabel(lang, t.metric);
  const total = round(t.changePerCycle * (t.windowCycles - 1), 1);
  const unit =
    t.metric === "period_sleep"
      ? lang === "it" ? "ore" : "hours"
      : t.metric === "cycle_length"
        ? lang === "it" ? "giorni" : "days"
        : lang === "it" ? "punti" : "points";
  if (lang === "it") {
    const fem = IT_TREND_FEMININE.has(t.metric);
    const verb =
      t.direction === "increasing"
        ? `è ${fem ? "aumentata" : "aumentato"} gradualmente`
        : `è ${fem ? "diminuita" : "diminuito"} gradualmente`;
    return `Negli ultimi ${t.windowCycles} cicli registrati, ${label} ${verb} di circa ${total} ${unit} in totale.`;
  }
  const verb = t.direction === "increasing" ? "gradually increased" : "gradually decreased";
  return `Over your last ${t.windowCycles} recorded cycles, ${label} has ${verb} by about ${total} ${unit} in total.`;
}

export function trendDetail(lang: Lang, t: BaselineTrend): string {
  if (lang === "it") {
    return `${trendSummary(lang, t)} È misurato come linea di tendenza (minimi quadrati) sui tuoi ultimi ${t.windowCycles} cicli registrati (circa ${t.changePerCycle} per ciclo).`;
  }
  return `${trendSummary(lang, t)} This is measured as a least-squares trend line across your last ${t.windowCycles} recorded cycles (about ${t.changePerCycle} per cycle).`;
}

export function trendTitle(lang: Lang, t: BaselineTrend): string {
  const label = trendMetricLabel(lang, t.metric);
  return lang === "it" ? `Una tendenza in ${label}` : `A trend in ${label}`;
}

export function trendGuidance(lang: Lang, t: BaselineTrend): string | undefined {
  if (!["cycle_length", "early_period_pain"].includes(t.metric)) return undefined;
  return lang === "it"
    ? "Se questo cambiamento continua, peggiora o ti preoccupa, valuta di parlarne con un professionista sanitario."
    : "If this change continues, becomes severe, or concerns you, consider discussing it with a healthcare professional.";
}

function trendMetricLabel(lang: Lang, metric: BaselineTrend["metric"]): string {
  const en: Record<string, string> = {
    cycle_length: "your cycle length",
    early_period_pain: "your Day 1–3 pain",
    period_sleep: "your sleep during your period",
    energy: "your average energy",
  };
  const it: Record<string, string> = {
    cycle_length: "la durata del ciclo",
    early_period_pain: "il dolore dei giorni 1–3",
    period_sleep: "il sonno durante le mestruazioni",
    energy: "l'energia media",
  };
  return (lang === "it" ? it : en)[metric] ?? metric;
}

/* --------------------------------------------------------- readiness */

export function readinessMessage(lang: Lang, r: BaselineReadiness): string {
  if (lang === "en") return r.message;
  switch (r.level) {
    case "ready":
      return "Il tuo Specchio è pronto. I confronti ora usano un quadro stabile della tua normalità.";
    case "improving":
      return "La tua normalità personale sta diventando più utile. Ancora un ciclo e i confronti saranno solidi.";
    case "learning":
      return "Iniziamo a capire i tuoi andamenti. Un paio di cicli in più renderanno tutto più preciso.";
    default:
      return "Il tuo primo ciclo ci dà un punto di partenza. Continua a registrare e il tuo Specchio prenderà forma.";
  }
}

/* --------------------------------------------------------- safety phrases */

const SAFETY_PHRASE_IT: Record<string, string> = {
  "fainting or passing out": "svenimento o perdita di coscienza",
  "severe dizziness": "capogiri gravi",
  "not being able to stand": "l'incapacità di restare in piedi",
  "very heavy bleeding": "sanguinamento molto abbondante",
  "extremely severe pain": "dolore estremamente forte",
  "chest pain or trouble breathing": "dolore al petto o difficoltà a respirare",
  "a high fever": "febbre alta",
  "very high recorded pain": "dolore registrato molto alto",
  "heavy bleeding with clots": "sanguinamento abbondante con coaguli",
};

export function safetyPhrase(lang: Lang, englishPhrase: string): string {
  if (lang === "en") return englishPhrase;
  return SAFETY_PHRASE_IT[englishPhrase] ?? englishPhrase;
}

/* --------------------------------------------------------- report trend words */

export function reportTrendWord(lang: Lang, englishWord: string): string {
  if (lang === "en") return englishWord;
  const map: Record<string, string> = {
    "Not enough data for a trend": "Dati insufficienti per una tendenza",
    "Broadly stable": "Sostanzialmente stabile",
  };
  if (map[englishWord]) return map[englishWord];
  if (/higher in the more recent half/.test(englishWord))
    return "Leggermente più alto nella metà più recente";
  if (/lower in the more recent half/.test(englishWord))
    return "Leggermente più basso nella metà più recente";
  return englishWord;
}

/* --------------------------------------------------------- aggregate helpers */

export function changesToDiscuss(
  lang: Lang,
  comparisons: MetricComparison[],
  trends: BaselineTrend[],
): string[] {
  const out: string[] = [];
  for (const c of comparisons) {
    if (comparisonCategory(c) === "NOTICE") out.push(comparisonSummary(lang, c));
  }
  for (const t of trends) out.push(trendSummary(lang, t));
  if (out.length === 0) {
    out.push(
      lang === "it"
        ? "Nessun cambiamento si è distinto rispetto allo storico recente di questa persona per il periodo selezionato."
        : "No changes stood out against this person's own recent history for the selected period.",
    );
  }
  return out;
}

export function todayMirrorLine(
  lang: Lang,
  comparisons: MetricComparison[],
  trends: BaselineTrend[],
): string | null {
  const notice = comparisons.find((c) => comparisonCategory(c) === "NOTICE");
  if (notice) return comparisonSummary(lang, notice);
  if (trends[0]) return trendSummary(lang, trends[0]);
  const normal = comparisons.find((c) => comparisonCategory(c) === "NORMAL");
  if (normal) return comparisonSummary(lang, normal);
  return null;
}
