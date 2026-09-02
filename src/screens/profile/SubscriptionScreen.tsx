import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, Button, Badge } from "@/components/ui/primitives";
import { IconCheck } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import type { SubscriptionTier } from "@/models";

const TIERS: {
  tier: SubscriptionTier;
  name: string;
  price: string;
  features: string[];
  future?: boolean;
}[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    features: [
      "Cycle calendar & predictions",
      "Daily logging & symptom tracking",
      "Basic statistics",
      "Check-in (on-device)",
    ],
  },
  {
    tier: "premium",
    name: "Premium",
    price: "Demo",
    features: [
      "My Mirror personalised analysis",
      "Historical “Me vs. Me” comparisons",
      "Advanced trends & change detection",
      "Wearable integrations",
      "Professional PDF reports & sharing",
    ],
  },
  {
    tier: "professional",
    name: "Professional",
    price: "Future",
    future: true,
    features: [
      "Patient report sharing",
      "Clinician portal",
      "Pre-appointment report delivery",
    ],
  },
];

export function SubscriptionScreen() {
  const tier = useAppStore((s) => s.subscriptionTier);
  const setTier = useAppStore((s) => s.setSubscriptionTier);

  return (
    <>
      <AppBar title="Subscription" back="/profile" />
      <Screen>
        <Stack>
          <p className="text-sm text-muted">
            The prototype demonstrates the model only — there are no real payments.
            Use this to preview how Premium features appear.
          </p>

          {TIERS.map((t) => {
            const current = t.tier === tier;
            return (
              <Card key={t.tier} className={current ? "border-2 border-primary" : ""}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg text-ink">{t.name}</p>
                    <p className="text-sm text-muted">{t.price}</p>
                  </div>
                  {current ? (
                    <Badge tone="primary">Current</Badge>
                  ) : t.future ? (
                    <Badge tone="neutral">Planned</Badge>
                  ) : null}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink">
                      <IconCheck size={16} className="mt-0.5 shrink-0 text-normal" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!current && !t.future && (
                  <Button className="mt-4" block variant="secondary" onClick={() => setTier(t.tier)}>
                    Switch to {t.name} (demo)
                  </Button>
                )}
              </Card>
            );
          })}
        </Stack>
      </Screen>
    </>
  );
}
