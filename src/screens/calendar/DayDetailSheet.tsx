import { useNavigate } from "react-router-dom";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Badge } from "@/components/ui/primitives";
import { IconPencil } from "@/components/ui/icons";
import type { DailyHealthEntry, IsoDate } from "@/models";
import { todayIso } from "@/utils/date";
import { useFmt, useT } from "@/i18n";

interface Props {
  date: IsoDate | null;
  entry?: DailyHealthEntry;
  predictedPeriod?: boolean;
  onClose: () => void;
}

export function DayDetailSheet({ date, entry, predictedPeriod, onClose }: Props) {
  const navigate = useNavigate();
  const t = useT();
  const fmt = useFmt();
  if (!date) return null;
  const future = date > todayIso();

  const rows: { k: string; v: string }[] = [];
  if (entry?.bleeding) rows.push({ k: t("today.rowBleeding"), v: t.enum("bleeding", entry.bleeding.level) });
  if (entry?.pain)
    rows.push({
      k: t("today.rowPain"),
      v: `${entry.pain.level}/10${
        entry.pain.locations.length
          ? ` · ${entry.pain.locations.map((l) => t.enum("painLocation", l)).join(", ")}`
          : ""
      }`,
    });
  if (entry?.mood?.moods.length)
    rows.push({ k: t("today.rowMood"), v: entry.mood.moods.map((m) => t.enum("mood", m)).join(", ") });
  if (entry?.energy) rows.push({ k: t("today.rowEnergy"), v: t.energy(entry.energy.level) });
  if (entry?.sleep?.hours != null)
    rows.push({
      k: t("today.rowSleep"),
      v: `${fmt.hours(entry.sleep.hours)}${
        entry.sleep.quality ? ` · ${t.enum("sleepQuality", entry.sleep.quality)}` : ""
      }`,
    });
  if (entry?.symptoms.length)
    rows.push({
      k: t("today.rowSymptoms"),
      v: entry.symptoms.map((s) => t.enum("symptom", s.type)).join(", "),
    });
  if (entry?.activity) rows.push({ k: t("log.activity"), v: t.enum("activity", entry.activity.level) });
  if (entry?.notes) rows.push({ k: t("today.rowNote"), v: entry.notes });

  const vitalRows = entry?.vitals.slice(0, 4) ?? [];

  return (
    <Sheet
      open={!!date}
      onClose={onClose}
      title={fmt.longDate(date)}
      subtitle={fmt.relativeDay(date)}
      footer={
        <Button block icon={<IconPencil size={18} />} onClick={() => navigate(`/log?date=${date}`)}>
          {entry ? t("calendar.editEntry") : t("calendar.addEntry")}
        </Button>
      }
    >
      <div className="space-y-4">
        {predictedPeriod && <Badge tone="primary">{t("calendar.detailPredictedBadge")}</Badge>}
        {future && !predictedPeriod && <Badge tone="neutral">{t("calendar.detailFutureBadge")}</Badge>}

        {rows.length > 0 ? (
          <dl className="divide-y divide-line">
            {rows.map((r) => (
              <div key={r.k} className="flex gap-3 py-2 text-[13px] first:pt-0">
                <dt className="w-[92px] shrink-0 leading-tight text-muted">{r.k}</dt>
                <dd className="min-w-0 flex-1 text-ink">{r.v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted">
            {predictedPeriod ? t("calendar.detailPredictedBody") : t("calendar.detailEmpty")}
          </p>
        )}

        {vitalRows.length > 0 && (
          <div>
            <p className="pm-label mb-1.5">{t("calendar.fromDevices")}</p>
            <dl className="divide-y divide-line">
              {vitalRows.map((v) => (
                <div key={v.id} className="flex gap-3 py-2 text-[13px] first:pt-0">
                  <dt className="w-[92px] shrink-0 leading-tight text-muted">{t.enum("vital", v.type)}</dt>
                  <dd className="min-w-0 flex-1 text-ink">
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
