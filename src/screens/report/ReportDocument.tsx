import type { HealthReport } from "@/models";
import { brand } from "@/branding/brand";
import { useFmt, useT } from "@/i18n";
import { Timeline } from "@/components/charts/Timeline";

/**
 * The doctor-friendly one-page summary. Designed for a patient/clinician
 * conversation, not an analytics dashboard. Minimal colour so it prints
 * cleanly. Purely presentational — data + wording come from ReportService.
 */
export function ReportDocument({ report }: { report: HealthReport }) {
  const t = useT();
  const fmt = useFmt();
  const c = report.cycleSummary;
  return (
    <article className="pm-print-doc mx-auto max-w-[720px] bg-white p-7 text-[13px] leading-relaxed text-[#211e1c]">
      <header className="flex items-start justify-between border-b border-[#e8e3dd] pb-4">
        <div>
          <p className="font-display text-xl font-semibold">{brand.name}</p>
          <p className="mt-0.5 text-[12px] text-[#6c6762]">{t("report.docName")}</p>
        </div>
        <div className="text-right text-[12px] text-[#6c6762]">
          <p>
            <span className="font-semibold text-[#211e1c]">{t("report.docPeriod")}:</span>{" "}
            {report.range.label}
          </p>
          <p>
            {fmt.longDate(report.range.from)} – {fmt.longDate(report.range.to)}
          </p>
          <p className="mt-1">
            {t("report.docGenerated")} {fmt.longDate(report.generatedAt.slice(0, 10))}
          </p>
          <p>
            {t("report.docSubject")}: {report.subjectLabel}
            {report.subjectAge != null && ` · ${t("report.docAge")} ${report.subjectAge}`}
          </p>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5">
        <Section title={t("report.secCycleSummary")}>
          <KV k={t("report.kRecordedCycles")} v={`${c.recordedCycles}`} />
          <KV k={t("report.kAvgLength")} v={c.averageLengthDays != null ? t("report.daysN", { n: c.averageLengthDays }) : "—"} />
          <KV
            k={t("report.kShortLong")}
            v={
              c.shortestLengthDays != null
                ? `${c.shortestLengthDays} / ${c.longestLengthDays} ${t("common.days")}`
                : "—"
            }
          />
          <KV k={t("report.kVariabilitySd")} v={c.variabilityDays != null ? `±${c.variabilityDays} ${t("common.days")}` : "—"} />
          <KV
            k={t("report.kAvgPeriod")}
            v={c.averagePeriodDurationDays != null ? t("report.daysN", { n: c.averagePeriodDurationDays }) : "—"}
          />
        </Section>

        <Section title={t("report.secPain")}>
          <KV k={t("report.kTypicalLevel")} v={report.pain.typicalLevel != null ? `${report.pain.typicalLevel} / 10` : "—"} />
          <KV k={t("report.kHighest")} v={report.pain.highestRecorded != null ? `${report.pain.highestRecorded} / 10` : "—"} />
          <KV k={t("report.kHighPainDays")} v={`${report.pain.highPainDays}`} />
          <KV k={t("report.kTrend")} v={report.pain.trend} />
        </Section>

        <Section title={t("report.secBleeding")}>
          {report.bleeding.recorded ? (
            <>
              <KV k={t("report.kTypicalPattern")} v={report.bleeding.typicalPattern} />
              <KV k={t("report.kDaysHeavy")} v={`${report.bleeding.heavyDays}`} />
              <KV k={t("report.kChange")} v={report.bleeding.changeNote} />
            </>
          ) : (
            <p className="text-[#6c6762]">{t("report.bleedingNotRecorded")}</p>
          )}
        </Section>

        <Section title={t("report.secEnergySleep")}>
          <KV k={t("report.kAvgEnergy")} v={report.energy.average != null ? `${report.energy.average} / 5` : "—"} />
          <KV k={t("report.kEnergyTrend")} v={report.energy.trend} />
          <KV k={t("report.kAvgSleep")} v={report.sleep.averageHours != null ? fmt.hours(report.sleep.averageHours) : "—"} />
          <KV k={t("report.kSleepTrend")} v={report.sleep.trend} />
        </Section>

        <Section title={t("report.secSymptoms")}>
          {report.symptoms.length ? (
            <ul className="space-y-0.5">
              {report.symptoms.map((s) => (
                <li key={s.label} className="flex justify-between">
                  <span>{s.label}</span>
                  <span className="text-[#6c6762]">
                    {s.daysLogged} {t("common.days")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#6c6762]">{t("report.noneLogged")}</p>
          )}
        </Section>

        <Section title={t("report.secOther")}>
          {report.otherSignals.length ? (
            <ul className="space-y-0.5">
              {report.otherSignals.map((s) => (
                <li key={s.label} className="flex justify-between">
                  <span>{s.label}</span>
                  <span className="text-[#6c6762]">
                    {s.value}
                    {s.trend ? ` · ${s.trend}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#6c6762]">{t("report.noDeviceData")}</p>
          )}
        </Section>
      </div>

      <div className="mt-6 rounded-lg border border-[#e8e3dd] bg-[#faf8f5] p-4">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#6c6762]">
          {t("report.discussHeading")}
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {report.changesToDiscuss.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-[#6c6762]">{t("report.discussFootnote")}</p>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#6c6762]">
          {t("report.timelineHeading")}
        </h3>
        {report.timeline.length ? (
          <Timeline entries={report.timeline} from={report.range.from} to={report.range.to} />
        ) : (
          <p className="text-[#6c6762]">{t("report.timelineEmpty")}</p>
        )}
      </div>

      <footer className="mt-7 border-t border-[#e8e3dd] pt-3 text-[11px] text-[#6c6762]">
        <p>{t("disclaimer.reportAttribution")}</p>
        <p className="mt-0.5 font-medium text-[#211e1c]">{report.disclaimer}</p>
      </footer>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-1.5 border-b border-[#efeae4] pb-1 text-[12px] font-semibold uppercase tracking-wide text-[#6c6762]">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#6c6762]">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
