import { useEffect, useMemo, useState } from "react";
import { AppShell, navigationByRole } from "./components/AppShell";
import { ConfirmationProvider } from "./components/ConfirmationProvider";
import { EmployeeQuarterlyPanel } from "./components/EmployeeQuarterlyPanel";
import { ManagerQuarterlyPanel } from "./components/ManagerQuarterlyPanel";
import { ReportingDashboard } from "./components/ReportingDashboard";
import { ToastProvider } from "./components/ToastProvider";
import { apiClient } from "./lib/api";
import { AdminPortalPage } from "./pages/AdminPortalPage";
import { EmployeeGoalsPage } from "./pages/EmployeeGoalsPage";
import { LoginPage } from "./pages/LoginPage";
import { ManagerApprovalPage } from "./pages/ManagerApprovalPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [selectedView, setSelectedView] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const navigation = navigationByRole[user?.role] ?? [];
  const activeView = navigation.some((item) => item.id === selectedView) ? selectedView : navigation[0]?.id;

  const portalLabel = useMemo(() => {
    if (user?.role === "ADMIN") return "Admin Portal";
    if (user?.role === "MANAGER") return "Manager Portal";
    return "Employee Portal";
  }, [user?.role]);

  useEffect(() => {
    async function restoreSession() {
      try {
        const { data } = await apiClient.get("/auth/me");
        setUser(data.user);
      } catch (error) {
        console.warn("Session restore failed", {
          baseURL: apiClient.defaults.baseURL,
          message: error.message
        });
        setUser(null);
      } finally {
        setIsLoadingSession(false);
      }
    }

    restoreSession();
  }, []);

  async function handleLogout() {
    await apiClient.post("/auth/logout");
    setUser(null);
    setSelectedView(null);
  }

  function handleAuthenticated(nextUser) {
    setSelectedView(null);
    setUser(nextUser);
  }

  function handleNavigate(view) {
    setSelectedView(view);
    window.scrollTo(0, 0);
  }

  let content;

  if (isLoadingSession) {
    content = (
      <div className="grid min-h-screen place-items-center bg-corporate-surface text-sm font-medium text-slate-500">
        Restoring secure session...
      </div>
    );
  } else if (!user) {
    content = <LoginPage onAuthenticated={handleAuthenticated} />;
  } else {
    content = (
      <AppShell activeView={activeView} onNavigate={handleNavigate} portalLabel={portalLabel} user={user} onLogout={handleLogout}>
      {activeView === "plan" ? (
        <EmployeeGoalsPage user={user} />
      ) : activeView === "check-ins" ? (
        <EmployeeQuarterlyPanel />
      ) : activeView === "team" ? (
        <ManagerApprovalPage user={user} />
      ) : activeView === "team-check-ins" ? (
        <ManagerQuarterlyPanel />
      ) : activeView === "administration" ? (
        <AdminPortalPage />
      ) : activeView === "reports" ? (
        <ReportingDashboard scopeLabel={user.role === "ADMIN" ? "Organization analytics" : "Team analytics"} />
      ) : (
        null
      )}
      </AppShell>
    );
  }

  return (
    <ToastProvider>
      <ConfirmationProvider>{content}</ConfirmationProvider>
    </ToastProvider>
  );
}
