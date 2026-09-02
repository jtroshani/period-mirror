import type { HealthReport } from "@/models";
import { brand } from "@/branding/brand";
import { formatLongDate } from "@/utils/date";
import { formatHours } from "@/utils/format";
import { Timeline } from "@/components/charts/Timeline";

/**
 * The doctor-friendly one-page summary. Designed for a patient/clinician
 * conversation, not as an analytics dashboard. Colour is minimal so it prints
 * cleanly. Purely presentational — data comes from ReportService.
 */
export function ReportDocument({ report }: { report: HealthReport }) {
  const c = report.cycleSummary;
  return (
    <article className="pm-print-doc mx-auto max-w-[720px] bg-white p-7 text-[13px] leading-relaxed text-[#211e1c]">
      {/* Header */}
      <header className="flex items-start justify-between border-b border-[#e8e3dd] pb-4">
        <div>
          <p className="font-display text-xl font-semibold">{brand.name}</p>
          <p className="mt-0.5 text-[12px] text-[#6c6762]">{brand.reportName}</p>
        </div>
        <div className="text-right text-[12px] text-[#6c6762]">
          <p>
            <span className="font-semibold text-[#211e1c]">Period:</span> {report.range.label}
          </p>
          <p>{formatLongDate(report.range.from)} – {formatLongDate(report.range.to)}</p>
          <p className="mt-1">Generated {formatLongDate(report.generatedAt.slice(0, 10))}</p>
          <p>Subject: {report.subjectLabel}</p>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5">
        <Section title="Cycle summary">
          <KV k="Recorded cycles" v={`${c.recordedCycles}`} />
          <KV k="Average length" v={c.averageLengthDays != null ? `${c.averageLengthDays} days` : "—"} />
          <KV
            k="Shortest / longest"
            v={
              c.shortestLengthDays != null
                ? `${c.shortestLengthDays} / ${c.longestLengthDays} days`
                : "—"
            }
          />
          <KV k="Variability (SD)" v={c.variabilityDays != null ? `±${c.variabilityDays} days` : "—"} />
          <KV
            k="Average period"
            v={c.averagePeriodDurationDays != null ? `${c.averagePeriodDurationDays} days` : "—"}
          />
        </Section>

        <Section title="Pain">
          <KV k="Typical level" v={report.pain.typicalLevel != null ? `${report.pain.typicalLevel} / 10` : "—"} />
          <KV k="Highest recorded" v={report.pain.highestRecorded != null ? `${report.pain.highestRecorded} / 10` : "—"} />
          <KV k="High-pain days (≥7)" v={`${report.pain.highPainDays}`} />
          <KV k="Trend" v={report.pain.trend} />
        </Section>

        <Section title="Bleeding">
          {report.bleeding.recorded ? (
            <>
              <KV k="Typical pattern" v={report.bleeding.typicalPattern} />
              <KV k="Days reported heavy" v={`${report.bleeding.heavyDays}`} />
              <KV k="Change" v={report.bleeding.changeNote} />
            </>
          ) : (
            <p className="text-[#6c6762]">Not recorded during this period.</p>
          )}
        </Section>

        <Section title="Energy & sleep">
          <KV k="Average energy" v={report.energy.average != null ? `${report.energy.average} / 5` : "—"} />
          <KV k="Energy trend" v={report.energy.trend} />
          <KV k="Average sleep" v={report.sleep.averageHours != null ? formatHours(report.sleep.averageHours) : "—"} />
          <KV k="Sleep trend" v={report.sleep.trend} />
        </Section>

        <Section title="Most frequent symptoms">
          {report.symptoms.length ? (
            <ul className="space-y-0.5">
              {report.symptoms.map((s) => (
                <li key={s.label} className="flex justify-between">
                  <span>{s.label}</span>
                  <span className="text-[#6c6762]">{s.daysLogged} days</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#6c6762]">None logged.</p>
          )}
        </Section>

        <Section title="Other health signals">
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
            <p className="text-[#6c6762]">No connected-device data in range.</p>
          )}
        </Section>
      </div>

      {/* Changes worth discussing */}
      <div className="mt-6 rounded-lg border border-[#e8e3dd] bg-[#faf8f5] p-4">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#6c6762]">
          Patterns that may be useful to discuss with a healthcare professional
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {report.changesToDiscuss.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-[#6c6762]">
          These are comparisons with this person's own recorded history. They are
          not diagnoses or assessments of severity.
        </p>
      </div>

      {/* Timeline */}
      <div className="mt-6">
        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#6c6762]">
          Cycle timeline
        </h3>
        {report.timeline.length ? (
          <Timeline entries={report.timeline} from={report.range.from} to={report.range.to} />
        ) : (
          <p className="text-[#6c6762]">Not enough completed cycles in range to chart.</p>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-7 border-t border-[#e8e3dd] pt-3 text-[11px] text-[#6c6762]">
        <p>{brand.reportAttribution}</p>
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
