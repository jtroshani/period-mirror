import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
import { Chip } from "@/components/ui/Chips";
import { SafetyBanner } from "@/components/ui/SafetyBanner";
import { IconCheck, IconSparkle, IconX, IconInfo } from "@/components/ui/icons";
import { aiExtractionService } from "@/services/ai";
import type { AIExtractionResult } from "@/services/ai";
import { useAppStore } from "@/store/useAppStore";
import { useTodayEntry } from "@/store/selectors";
import { todayIso } from "@/utils/date";
import { uid } from "@/utils/id";
import type { ExtractedItem } from "@/models";

const EXAMPLES = [
  "Cramps are worse than usual and I'm exhausted",
  "Bleeding is heavier today, plus a headache",
  "Bloated, irritable, slept badly",
];

type Phase = "input" | "thinking" | "review" | "done";

export function CheckInScreen() {
  const navigate = useNavigate();
  const today = todayIso();
  const entry = useTodayEntry();
  const addCheckIn = useAppStore((s) => s.addCheckIn);
  const addStructuredCheckIn = useAppStore((s) => s.addStructuredCheckIn);
  const applyExtractedItems = useAppStore((s) => s.applyExtractedItems);
  const aiConsent = useAppStore((s) => s.consent.aiProcessing);

  const [phase, setPhase] = useState<Phase>("input");
  const [text, setText] = useState("");
  const [result, setResult] = useState<AIExtractionResult | null>(null);
  const [items, setItems] = useState<ExtractedItem[]>([]);

  const run = async () => {
    if (text.trim().length < 3) return;
    setPhase("thinking");
    const res = await aiExtractionService.extract({
      text: text.trim(),
      date: today,
      context: { recentBleedingLevel: entry?.bleeding?.level },
    });
    setResult(res);
    setItems(res.items);
    setPhase("review");
  };

  const patchItem = (id: string, patch: Partial<ExtractedItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const setPainSeverity = (id: string, level: number) =>
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              needsSeverity: false,
              value: { ...(i.value as object), level },
              detail: `Around ${level}/10.`,
            }
          : i,
      ),
    );

  const save = () => {
    const accepted = items.filter((i) => i.accepted);
    const checkInId = uid("checkin");
    addCheckIn({ id: checkInId, date: today, createdAt: new Date().toISOString(), text: text.trim() });
    addStructuredCheckIn({
      id: uid("structured"),
      checkInId,
      date: today,
      createdAt: new Date().toISOString(),
      items: accepted,
      status: "confirmed",
      safetyNotice: result?.safety,
    });
    applyExtractedItems(today, accepted);
    setPhase("done");
  };

  const unresolved = items.some((i) => i.accepted && i.needsSeverity);

  return (
    <>
      <AppBar title="How do I feel today?" back="/today" />
      <Screen>
        {phase === "input" && (
          <Stack>
            <p className="text-[15px] leading-relaxed text-muted">
              Write naturally — a sentence or two about how you feel, any pain,
              your energy, sleep or bleeding. I'll suggest things you can save.
            </p>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="e.g. I have a strange pain on my right side, I'm very tired, and today my bleeding is heavier than usual."
              className="w-full rounded-card border border-line bg-surface p-4 text-[15px] leading-relaxed text-ink placeholder:text-faint"
            />
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <Chip key={ex} onClick={() => setText(ex)}>
                  {ex}
                </Chip>
              ))}
            </div>

            <Card inset className="flex items-start gap-2 text-xs leading-relaxed text-muted">
              <IconInfo size={15} className="mt-0.5 shrink-0" />
              <span>
                This structures what you describe — it does not diagnose or name
                conditions. {aiConsent ? "" : "AI processing is currently turned off in your privacy settings, so this runs entirely on your device."}
              </span>
            </Card>

            <Button block size="lg" icon={<IconSparkle size={18} />} onClick={run} disabled={text.trim().length < 3}>
              Read my words
            </Button>
          </Stack>
        )}

        {phase === "thinking" && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="animate-pulse text-primary">
              <IconSparkle size={32} />
            </span>
            <p className="text-sm text-muted">Reading your words…</p>
          </div>
        )}

        {phase === "review" && result && (
          <Stack>
            {result.safety && <SafetyBanner notice={result.safety} />}

            {items.length <= 1 ? (
              <EmptyState
                icon={<IconSparkle size={26} />}
                title="I couldn't pick out anything specific"
                body="Try mentioning pain, bleeding, energy, mood, sleep or a symptom — or log it directly."
                action={
                  <Button variant="secondary" onClick={() => setPhase("input")}>
                    Edit my words
                  </Button>
                }
              />
            ) : (
              <>
                <div>
                  <h2 className="font-display text-lg text-ink">
                    I found a few things you may want to save
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Confirm, adjust or remove each one. Nothing is saved until you
                    tap save.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {items
                    .filter((i) => i.field !== "note")
                    .map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onToggle={() => patchItem(item.id, { accepted: !item.accepted })}
                        onSeverity={(lvl) => setPainSeverity(item.id, lvl)}
                      />
                    ))}
                </div>

                {items.find((i) => i.field === "note") && (
                  <NoteToggle
                    item={items.find((i) => i.field === "note")!}
                    onToggle={() => {
                      const n = items.find((i) => i.field === "note")!;
                      patchItem(n.id, { accepted: !n.accepted });
                    }}
                  />
                )}

                <p className="text-xs text-faint">
                  Interpreted by: {result.modelLabel}
                </p>

                <div className="sticky bottom-2 space-y-2">
                  <Button
                    block
                    size="lg"
                    icon={<IconCheck size={18} />}
                    onClick={save}
                    disabled={unresolved || !items.some((i) => i.accepted)}
                  >
                    {unresolved ? "Set pain strength to continue" : "Save to today's history"}
                  </Button>
                </div>
              </>
            )}
          </Stack>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-normal-soft text-normal">
              <IconCheck size={30} />
            </span>
            <h2 className="font-display text-xl text-ink">Saved to today's history</h2>
            <p className="max-w-xs text-sm text-muted">
              You can review or edit everything in today's log.
            </p>
            <div className="flex gap-3">
              <Button variant="quiet" onClick={() => navigate("/log")}>
                View today's log
              </Button>
              <Button onClick={() => navigate("/today")}>Back to Today</Button>
            </div>
          </div>
        )}
      </Screen>
    </>
  );
}

function ItemCard({
  item,
  onToggle,
  onSeverity,
}: {
  item: ExtractedItem;
  onToggle: () => void;
  onSeverity: (level: number) => void;
}) {
  return (
    <Card
      className={`border transition-colors ${
        item.accepted ? "border-primary/40" : "border-line opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          aria-pressed={item.accepted}
          aria-label={item.accepted ? `Remove ${item.label}` : `Add ${item.label}`}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
            item.accepted
              ? "border-primary bg-primary text-white"
              : "border-line text-transparent"
          }`}
        >
          <IconCheck size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-ink">{item.label}</p>
          {item.detail && <p className="mt-0.5 text-sm text-muted">{item.detail}</p>}
          {item.sourcePhrase && (
            <p className="mt-1 text-xs italic text-faint">“…{item.sourcePhrase}…”</p>
          )}

          {item.field === "pain" && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold text-muted">
                {item.needsSeverity ? "How strong is the pain? (0–10)" : "Pain strength"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 11 }, (_, n) => {
                  const current = (item.value as { level?: number }).level;
                  return (
                    <button
                      key={n}
                      onClick={() => onSeverity(n)}
                      className={`h-9 w-9 rounded-lg text-sm font-semibold ${
                        current === n
                          ? "bg-primary text-white"
                          : "bg-surface-2 text-ink"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          aria-label="Dismiss"
          className="shrink-0 text-faint hover:text-ink"
        >
          <IconX size={18} />
        </button>
      </div>
    </Card>
  );
}

function NoteToggle({ item, onToggle }: { item: ExtractedItem; onToggle: () => void }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl bg-surface-2 p-3.5">
      <input
        type="checkbox"
        checked={item.accepted}
        onChange={onToggle}
        className="mt-0.5 h-5 w-5 accent-[rgb(var(--pm-primary))]"
      />
      <span className="text-sm text-ink">
        {item.label}
        <span className="mt-0.5 block text-xs text-muted">{item.detail}</span>
      </span>
    </label>
  );
}
