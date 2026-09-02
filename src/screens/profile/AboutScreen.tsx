import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card } from "@/components/ui/primitives";
import { Wordmark } from "@/branding/Wordmark";
import { brand } from "@/branding/brand";

export function AboutScreen() {
  return (
    <>
      <AppBar title={`About ${brand.name}`} back="/profile" />
      <Screen>
        <Stack>
          <Card className="flex flex-col items-center gap-2 py-8 text-center">
            <Wordmark size="lg" />
            <p className="text-xs text-faint">Prototype · v0.1.0</p>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink">The idea</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {brand.name} is not primarily a period-prediction app. Its purpose is
              to help you understand what is normal for your own body, and to
              recognise when something meaningfully changes — by comparing each
              cycle with your own history rather than a population average.
            </p>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink">What it will never do</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              It does not diagnose conditions, name diseases, or give treatment
              advice. It uses plain, inspectable statistics and always shows the
              recorded data behind an insight. Where a change stands out, it may
              suggest considering a conversation with a healthcare professional —
              nothing more.
            </p>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink">Privacy</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Built privacy-by-design: on-device storage by default, no advertising
              trackers, analytics off unless you turn it on, and full export /
              delete controls.
            </p>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink">Medical disclaimer</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {brand.medicalDisclaimerLong}
            </p>
          </Card>
        </Stack>
      </Screen>
    </>
  );
}
