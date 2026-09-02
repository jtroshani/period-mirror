import { AppBar } from "@/components/ui/AppBar";
import { Screen, Stack } from "@/components/layout/Screen";
import { Card, Button, Badge } from "@/components/ui/primitives";
import { IconCheck } from "@/components/ui/icons";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/i18n";
import type { SubscriptionTier } from "@/models";

export function SubscriptionScreen() {
  const t = useT();
  const tier = useAppStore((s) => s.subscriptionTier);
  const setTier = useAppStore((s) => s.setSubscriptionTier);

  const tiers: {
    tier: SubscriptionTier;
    name: string;
    price: string;
    features: string[];
    future?: boolean;
  }[] = [
    {
      tier: "free",
      name: t("subscription.freeName"),
      price: t("subscription.freePrice"),
      features: [
        t("subscription.free1"),
        t("subscription.free2"),
        t("subscription.free3"),
        t("subscription.free4"),
      ],
    },
    {
      tier: "premium",
      name: t("subscription.premiumName"),
      price: t("subscription.premiumPrice"),
      features: [
        t("subscription.prem1"),
        t("subscription.prem2"),
        t("subscription.prem3"),
        t("subscription.prem4"),
        t("subscription.prem5"),
      ],
    },
    {
      tier: "professional",
      name: t("subscription.proName"),
      price: t("subscription.proPrice"),
      future: true,
      features: [t("subscription.pro1"), t("subscription.pro2"), t("subscription.pro3")],
    },
  ];

  return (
    <>
      <AppBar title={t("subscription.title")} back="/profile" />
      <Screen>
        <Stack>
          <p className="text-sm text-muted">{t("subscription.intro")}</p>

          {tiers.map((tt) => {
            const current = tt.tier === tier;
            return (
              <Card key={tt.tier} className={current ? "border-2 border-primary" : ""}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg text-ink">{tt.name}</p>
                    <p className="text-sm text-muted">{tt.price}</p>
                  </div>
                  {current ? (
                    <Badge tone="primary">{t("subscription.current")}</Badge>
                  ) : tt.future ? (
                    <Badge tone="neutral">{t("subscription.planned")}</Badge>
                  ) : null}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {tt.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink">
                      <IconCheck size={16} className="mt-0.5 shrink-0 text-normal" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!current && !tt.future && (
                  <Button className="mt-4" block variant="secondary" onClick={() => setTier(tt.tier)}>
                    {t("subscription.switchTo", { name: tt.name })}
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
