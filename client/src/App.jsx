import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { ConfirmationProvider } from "./components/ConfirmationProvider";
import { ToastProvider } from "./components/ToastProvider";
import { apiClient } from "./lib/api";
import { AdminPortalPage } from "./pages/AdminPortalPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeeGoalsPage } from "./pages/EmployeeGoalsPage";
import { LoginPage } from "./pages/LoginPage";
import { ManagerApprovalPage } from "./pages/ManagerApprovalPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

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
      } catch {
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
  }

  let content;

  if (isLoadingSession) {
    content = (
      <div className="grid min-h-screen place-items-center bg-corporate-surface text-sm font-medium text-slate-500">
        Restoring secure session...
      </div>
    );
  } else if (!user) {
    content = <LoginPage onAuthenticated={setUser} />;
  } else {
    content = (
      <AppShell portalLabel={portalLabel} user={user} onLogout={handleLogout}>
      {user.role === "EMPLOYEE" ? (
        <EmployeeGoalsPage user={user} />
      ) : user.role === "MANAGER" ? (
        <ManagerApprovalPage user={user} />
      ) : user.role === "ADMIN" ? (
        <AdminPortalPage />
      ) : (
        <DashboardPage portalLabel={portalLabel} user={user} />
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
