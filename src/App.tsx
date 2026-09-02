import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { PhoneFrame } from "@/components/layout/PhoneFrame";
import { AppScaffold } from "@/components/layout/AppScaffold";
import { Wordmark } from "@/branding/Wordmark";
import { useAppStore } from "@/store/useAppStore";
import { useThemeEffect } from "@/hooks/useTheme";
import { LOCALES } from "@/i18n";

import { WelcomeScreen } from "@/screens/welcome/WelcomeScreen";
import { OnboardingScreen } from "@/screens/onboarding/OnboardingScreen";
import { TodayScreen } from "@/screens/today/TodayScreen";
import { CheckInScreen } from "@/screens/checkin/CheckInScreen";
import { LogScreen } from "@/screens/log/LogScreen";
import { CalendarScreen } from "@/screens/calendar/CalendarScreen";
import { MirrorScreen } from "@/screens/mirror/MirrorScreen";
import { ReportScreen } from "@/screens/report/ReportScreen";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";
import { PrivacyCenterScreen } from "@/screens/profile/PrivacyCenterScreen";
import { ConnectedDevicesScreen } from "@/screens/profile/ConnectedDevicesScreen";
import { SubscriptionScreen } from "@/screens/profile/SubscriptionScreen";
import { AboutScreen } from "@/screens/profile/AboutScreen";

/** Column wrapper for screens shown without the bottom nav. */
function PlainLayout() {
  return (
    <div className="flex h-full min-h-[100dvh] flex-col lg:min-h-0">
      <Outlet />
    </div>
  );
}

/** Redirect to Welcome until onboarding or demo mode has set things up. */
function RequireSetup({ children }: { children: React.ReactNode }) {
  const mode = useAppStore((s) => s.mode);
  if (mode === "empty") return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

function Splash() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg">
      <div className="animate-fade-in">
        <Wordmark size="lg" />
      </div>
    </div>
  );
}

export default function App() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const mode = useAppStore((s) => s.mode);
  const language = useAppStore((s) => s.settings.language);
  const { pathname } = useLocation();

  useThemeEffect();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.lang = LOCALES[language] ?? "en";
  }, [language]);

  // Keep viewport at top on route change.
  useEffect(() => {
    document.querySelector("main")?.scrollTo?.(0, 0);
  }, [pathname]);

  if (!hydrated) return <Splash />;

  const home = mode === "empty" ? "/welcome" : "/today";

  return (
    <PhoneFrame>
      <Routes>
        <Route path="/" element={<Navigate to={home} replace />} />
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />

        <Route
          element={
            <RequireSetup>
              <AppScaffold />
            </RequireSetup>
          }
        >
          <Route path="/today" element={<TodayScreen />} />
          <Route path="/calendar" element={<CalendarScreen />} />
          <Route path="/mirror" element={<MirrorScreen />} />
          <Route path="/report" element={<ReportScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Route>

        <Route
          element={
            <RequireSetup>
              <PlainLayout />
            </RequireSetup>
          }
        >
          <Route path="/checkin" element={<CheckInScreen />} />
          <Route path="/log" element={<LogScreen />} />
          <Route path="/profile/privacy" element={<PrivacyCenterScreen />} />
          <Route path="/profile/devices" element={<ConnectedDevicesScreen />} />
          <Route path="/profile/subscription" element={<SubscriptionScreen />} />
          <Route path="/profile/about" element={<AboutScreen />} />
        </Route>

        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    </PhoneFrame>
  );
}
