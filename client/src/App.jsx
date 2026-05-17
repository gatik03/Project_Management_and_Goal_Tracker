import { useState } from "react";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";

export default function App() {
  const [view, setView] = useState("landing");

  if (view === "landing") {
    return <LandingPage onOpenDashboard={() => setView("dashboard")} />;
  }

  return (
    <AppShell onNavigateHome={() => setView("landing")}>
      <DashboardPage />
    </AppShell>
  );
}
