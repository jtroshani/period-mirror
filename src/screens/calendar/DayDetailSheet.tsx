import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button, Badge } from "@/components/ui/primitives";
import {
  IconPencil,
  IconDrop,
  IconHeart,
  IconClock,
  IconLeaf,
  IconSparkle,
  IconInfo,
} from "@/components/ui/icons";
import type { DailyHealthEntry, IsoDate } from "@/models";
import { todayIso } from "@/utils/date";
import { useFmt, useT } from "@/i18n";
import { useEntries, useUser } from "@/store/selectors";
import { getCyclePosition } from "@/engine/cycles";

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
  const entries = useEntries();
  const user = useUser();
  if (!date) return null;
  const future = date > todayIso();
  const pos = getCyclePosition(entries, user, date);
  const dayPhase =
    pos && !future
      ? t("calendar.dayPhase", {
          n: pos.cycleDay,
          phase: t.enum("phase", pos.phase).toLowerCase(),
        })
      : null;

  const tiles: { icon: ReactNode; title: string; value: string; tint: string }[] = [];
  if (entry?.bleeding)
    tiles.push({
      icon: <IconDrop size={15} />,
      title: t("today.rowBleeding"),
      value: t.enum("bleeding", entry.bleeding.level),
      tint: "bg-phase-menstrual/15 text-phase-menstrual",
    });
  if (entry?.pain)
    tiles.push({
      icon: <IconInfo size={15} />,
      title: t("today.rowPain"),
      value: `${entry.pain.level}/10${
        entry.pain.locations.length
          ? ` · ${entry.pain.locations.map((l) => t.enum("painLocation", l)).join(", ")}`
          : ""
      }`,
      tint: "bg-notice-soft text-notice",
    });
  if (entry?.mood?.moods.length)
    tiles.push({
      icon: <IconHeart size={15} />,
      title: t("today.rowMood"),
      value: entry.mood.moods.map((m) => t.enum("mood", m)).join(", "),
      tint: "bg-phase-luteal/20 text-phase-luteal",
    });
  if (entry?.symptoms.length)
    tiles.push({
      icon: <IconSparkle size={15} />,
      title: t("today.rowSymptoms"),
      value: entry.symptoms.map((s) => t.enum("symptom", s.type)).join(", "),
      tint: "bg-phase-follicular/20 text-phase-follicular",
    });
  if (entry?.sleep?.hours != null)
    tiles.push({
      icon: <IconClock size={15} />,
      title: t("today.rowSleep"),
      value: `${fmt.hours(entry.sleep.hours)}${
        entry.sleep.quality ? ` · ${t.enum("sleepQuality", entry.sleep.quality)}` : ""
      }`,
      tint: "bg-primary-soft text-primary",
    });
  if (entry?.energy)
    tiles.push({
      icon: <IconLeaf size={15} />,
      title: t("today.rowEnergy"),
      value: t.energy(entry.energy.level),
      tint: "bg-accent/15 text-accent",
    });
  if (entry?.activity)
    tiles.push({
      icon: <IconLeaf size={15} />,
      title: t("log.activity"),
      value: t.enum("activity", entry.activity.level),
      tint: "bg-normal-soft text-normal",
    });

  const vitalRows = entry?.vitals.slice(0, 4) ?? [];

  return (
    <Sheet
      open={!!date}
      onClose={onClose}
      title={fmt.longDate(date)}
      subtitle={
        predictedPeriod
          ? t("calendar.detailPredictedBadge")
          : dayPhase ?? (entry ? undefined : fmt.relativeDay(date))
      }
      footer={
        <Button block icon={<IconPencil size={18} />} onClick={() => navigate(`/log?date=${date}`)}>
          {entry ? t("calendar.editEntry") : t("calendar.addEntry")}
        </Button>
      }
    >
      <div className="space-y-4">
        {(predictedPeriod || future) && (
          <Badge tone={predictedPeriod ? "primary" : "neutral"}>
            {predictedPeriod ? t("calendar.detailPredictedBadge") : t("calendar.detailFutureBadge")}
          </Badge>
        )}

        {tiles.length > 0 ? (
          <div>
            <p className="mb-2 text-[12px] font-semibold text-muted">{t("calendar.loggedData")}</p>
            <div className="grid grid-cols-2 gap-2">
              {tiles.map((tile) => (
                <div key={tile.title} className="rounded-2xl bg-surface-2 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`grid h-6 w-6 place-items-center rounded-lg ${tile.tint}`}>
                      {tile.icon}
                    </span>
                    <span className="text-[12px] font-semibold text-muted">{tile.title}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-snug text-ink">{tile.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-muted">
            {predictedPeriod ? t("calendar.detailPredictedBody") : t("calendar.detailEmpty")}
          </p>
        )}

        {entry?.notes && (
          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-muted">{t("log.notes")}</p>
            <p className="rounded-2xl bg-surface-2 p-3 text-[13px] leading-relaxed text-ink">
              {entry.notes}
            </p>
          </div>
        )}

        {vitalRows.length > 0 && (
          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-muted">{t("calendar.fromDevices")}</p>
            <dl className="divide-y divide-line rounded-2xl bg-surface-2 px-3">
              {vitalRows.map((v) => (
                <div key={v.id} className="flex justify-between py-2 text-[13px] first:pt-2.5 last:pb-2.5">
                  <dt className="text-muted">{t.enum("vital", v.type)}</dt>
                  <dd className="font-medium text-ink">
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
