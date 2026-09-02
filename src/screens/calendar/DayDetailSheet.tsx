import { useNavigate } from "react-router-dom";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Badge } from "@/components/ui/primitives";
import { IconPencil } from "@/components/ui/icons";
import type { DailyHealthEntry, IsoDate } from "@/models";
import { formatLongDate, relativeDayLabel, todayIso } from "@/utils/date";
import { energyWord, label, formatHours } from "@/utils/format";

interface Props {
  date: IsoDate | null;
  entry?: DailyHealthEntry;
  predictedPeriod?: boolean;
  onClose: () => void;
}

export function DayDetailSheet({ date, entry, predictedPeriod, onClose }: Props) {
  const navigate = useNavigate();
  if (!date) return null;
  const future = date > todayIso();

  const rows: { k: string; v: string }[] = [];
  if (entry?.bleeding) rows.push({ k: "Bleeding", v: label(entry.bleeding.level) });
  if (entry?.pain)
    rows.push({
      k: "Pain",
      v: `${entry.pain.level}/10${
        entry.pain.locations.length ? ` · ${entry.pain.locations.map(label).join(", ")}` : ""
      }`,
    });
  if (entry?.mood?.moods.length)
    rows.push({ k: "Mood", v: entry.mood.moods.map(label).join(", ") });
  if (entry?.energy) rows.push({ k: "Energy", v: energyWord(entry.energy.level) });
  if (entry?.sleep?.hours != null)
    rows.push({
      k: "Sleep",
      v: `${formatHours(entry.sleep.hours)}${entry.sleep.quality ? ` · ${label(entry.sleep.quality)}` : ""}`,
    });
  if (entry?.symptoms.length)
    rows.push({ k: "Symptoms", v: entry.symptoms.map((s) => label(s.type)).join(", ") });
  if (entry?.activity) rows.push({ k: "Activity", v: label(entry.activity.level) });
  if (entry?.notes) rows.push({ k: "Note", v: entry.notes });

  const vitalRows = entry?.vitals.slice(0, 4) ?? [];

  return (
    <Sheet
      open={!!date}
      onClose={onClose}
      title={formatLongDate(date)}
      subtitle={relativeDayLabel(date)}
      footer={
        <Button
          block
          icon={<IconPencil size={18} />}
          onClick={() => navigate(`/log?date=${date}`)}
        >
          {entry ? "Edit this entry" : "Add an entry"}
        </Button>
      }
    >
      <div className="space-y-4">
        {predictedPeriod && (
          <Badge tone="primary">Predicted period day — not recorded</Badge>
        )}
        {future && !predictedPeriod && (
          <Badge tone="neutral">In the future</Badge>
        )}

        {rows.length > 0 ? (
          <dl className="divide-y divide-line">
            {rows.map((r) => (
              <div key={r.k} className="flex gap-4 py-2.5 text-sm first:pt-0">
                <dt className="w-24 shrink-0 text-muted">{r.k}</dt>
                <dd className="text-ink">{r.v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted">
            {predictedPeriod
              ? "This is a prediction based on your recent cycles, not recorded data."
              : "Nothing recorded for this day."}
          </p>
        )}

        {vitalRows.length > 0 && (
          <div>
            <p className="pm-label mb-1.5">From connected devices (sample)</p>
            <dl className="divide-y divide-line">
              {vitalRows.map((v) => (
                <div key={v.id} className="flex gap-4 py-2 text-sm first:pt-0">
                  <dt className="w-24 shrink-0 text-muted">{label(v.type)}</dt>
                  <dd className="text-ink">
                    {v.value} {v.unit}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </Sheet>
  );
}
