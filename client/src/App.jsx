import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ChartNoAxesCombined,
  Bell,
  ClipboardList,
  History,
  LayoutList,
  LogOut,
  Moon,
  Network,
  Settings2,
  ShieldCheck,
  Sun,
  UsersRound,
} from "lucide-react";
import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { api, setUnauthorizedHandler } from "./lib/api";
import { BRAND } from "./lib/brand";
import { useNotifications } from "./lib/notifications";
import { Button, IconButton, Skeleton, ToastProvider } from "./ui";

const loadPlanPage = () => import("./features/plan/PlanPage");
if (window.location.pathname === "/plan" || window.location.pathname.startsWith("/plan/")) {
  void loadPlanPage();
}
const PlanPage = lazy(loadPlanPage);
const CheckInsPage = lazy(() => import("./features/plan/CheckInsPage"));
const TeamPage = lazy(() => import("./features/review/TeamPage"));
const TeamCheckInsPage = lazy(
  () => import("./features/review/TeamCheckInsPage"),
);
const AdminPage = lazy(() => import("./features/admin/AdminPage"));
const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));
const EntryPage = lazy(() => import("./features/entry/EntryPage"));
const LoginPage = lazy(() => import("./features/entry/LoginPage"));
const NotificationsPage = lazy(() => import("./features/notifications/NotificationsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
  },
});
const SessionContext = createContext(null);
export function useSession() {
  return useContext(SessionContext);
}
export const homeForRole = {
  EMPLOYEE: "/plan",
  MANAGER: "/team",
  ADMIN: "/admin/people",
};
const navigation = {
  EMPLOYEE: [
    { to: "/plan", label: "Plan", icon: ClipboardList },
    { to: "/check-ins", label: "Check-ins", icon: LayoutList },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  MANAGER: [
    { to: "/team", label: "Team", icon: UsersRound },
    { to: "/team/check-ins", label: "Check-ins", icon: LayoutList },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/reports", label: "Reports", icon: ChartNoAxesCombined },
  ],
  ADMIN: [
    { to: "/admin/people", label: "People", icon: UsersRound },
    { to: "/admin/hierarchy", label: "Hierarchy", icon: Network },
    { to: "/admin/cycles", label: "Cycles", icon: Settings2 },
    { to: "/admin/unlocks", label: "Unlocks", icon: ShieldCheck },
    { to: "/admin/audit", label: "Audit", icon: History },
    { to: "/reports", label: "Reports", icon: ChartNoAxesCombined },
  ],
};
function SessionProvider({ children }) {
  const navigate = useNavigate(),
    location = useLocation(),
    cache = useQueryClient();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: api.me,
    retry: false,
  });
  useEffect(
    () =>
      setUnauthorizedHandler(() => {
        cache.setQueryData(["session"], null);
        navigate(
          "/login?next=" +
            encodeURIComponent(location.pathname + location.search),
          { replace: true },
        );
      }),
    [cache, navigate, location.pathname, location.search],
  );
  useEffect(() => {
    if (location.pathname === "/plan" || location.pathname.startsWith("/plan/")) {
      void cache.prefetchQuery({
        queryKey: ["employee-goals"],
        queryFn: api.employeeGoals,
        retry: false,
      });
    }
  }, [cache, location.pathname]);
  async function login(email, password, next) {
    const user = await api.login({ email, password });
    cache.setQueryData(["session"], user);
    const allowed =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : homeForRole[user.role];
    navigate(allowed, { replace: true });
    return user;
  }
  async function logout() {
    try {
      await api.logout();
    } finally {
      cache.clear();
      cache.setQueryData(["session"], null);
      navigate("/login", { replace: true });
    }
  }
  return (
    <SessionContext.Provider
      value={{
        user: session.data ?? null,
        loading: session.isPending,
        login,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
function Protected({ role }) {
  const { user, loading } = useSession();
  const location = useLocation();
  if (loading)
    return (
      <main className="page-wrap">
        <Skeleton />
      </main>
    );
  if (!user)
    return (
      <Navigate
        to={
          "/login?next=" +
          encodeURIComponent(location.pathname + location.search)
        }
        replace
      />
    );
  if (role && !role.includes(user.role)) return <Forbidden />;
  return (
    <SiteShell user={user}>
      <Outlet />
    </SiteShell>
  );
}
function ThemeButton() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "light",
  );
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.querySelector("meta[name=theme-color]").content =
      getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();
    localStorage.setItem("goal-tracker-theme", next);
    setTheme(next);
  }
  return (
    <IconButton
      label={"Switch to " + (theme === "dark" ? "light" : "dark") + " theme"}
      onClick={toggle}
    >
      {theme === "dark" ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </IconButton>
  );
}
function CycleIndicator() {
  const { data } = useQuery({
    queryKey: ["active-cycle"],
    queryFn: api.activeCycle,
    retry: false,
  });
  if (!data) return null;
  const days = Math.max(
    0,
    Math.ceil(
      (new Date(data.endDate + "T23:59:59").getTime() - Date.now()) / 86400000,
    ),
  );
  return (
    <span className="cycle-pill">
      {data.quarter} ends in {days} {days === 1 ? "day" : "days"}
    </span>
  );
}
function NavItem({ item, unreadCount = 0 }) {
  const Icon = item.icon;
  return (
    <NavLink
      className="nav-link"
      to={item.to}
      end={item.to === "/team" || item.to === "/plan"}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{item.label}</span>
      {item.to === "/notifications" && unreadCount > 0 && (
        <span className="nav-count" aria-label={`${unreadCount} unread notifications`}>
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </NavLink>
  );
}
function SiteShell({ user, children }) {
  const { logout } = useSession();
  const items = navigation[user.role] ?? [];
  const noticeData = useNotifications(user.role !== "ADMIN").data;
  const unreadCount = noticeData?.pages?.[0]?.unreadCount ?? 0;
  return (
    <div className="site-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="top-rail">
        <Link to={homeForRole[user.role]} className="wordmark" translate="no">
          <span className="brand-mark" aria-hidden="true" />
          {BRAND}
        </Link>
        <nav className="top-nav" aria-label="Main navigation">
          {items.map((item) => (
            <NavItem key={item.to} item={item} unreadCount={unreadCount} />
          ))}
        </nav>
        <div className="rail-end">
          <CycleIndicator />
          <ThemeButton />
          <details className="account-menu">
            <summary className="btn" aria-label="Account menu">
              <span className="account-name">{user.name}</span>
              <span className="small muted">{user.role.toLowerCase()}</span>
            </summary>
            <div className="account-popover">
              <p>
                <strong>{user.name}</strong>
                <br />
                <span className="small muted">{user.email}</span>
              </p>
              <Button onClick={logout}>
                <LogOut size={16} aria-hidden="true" />
                Sign out
              </Button>
            </div>
          </details>
        </div>
      </header>
      <main id="main-content" className="page-wrap">
        {children}
      </main>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {items.length <= 4 ? (
          items.map((item) => <NavItem key={item.to} item={item} unreadCount={unreadCount} />)
        ) : (
          <>
            {items.slice(0, 4).map((item) => (
              <NavItem key={item.to} item={item} unreadCount={unreadCount} />
            ))}
            <details className="mobile-more">
              <summary className="nav-link">More</summary>
              <div className="more-popover">
                {items.slice(4).map((item) => (
                  <NavItem key={item.to} item={item} unreadCount={unreadCount} />
                ))}
              </div>
            </details>
          </>
        )}
      </nav>
    </div>
  );
}
function Forbidden() {
  const { user } = useSession();
  return (
    <main className="page-wrap">
      <div className="panel panel-pad">
        <h1>That page is for a different role</h1>
        <p className="page-intro">
          Your account cannot open this workspace. Return to your permitted
          area.
        </p>
        <Link
          className="btn btn-primary"
          to={homeForRole[user?.role] ?? "/login"}
        >
          Go to my workspace
        </Link>
      </div>
    </main>
  );
}
function NotFound() {
  const { user } = useSession();
  return (
    <main className="page-wrap">
      <div className="panel panel-pad">
        <h1>Page not found</h1>
        <p className="page-intro">
          The address may have changed. Choose a section from your workspace.
        </p>
        <Link className="btn btn-primary" to={homeForRole[user?.role] ?? "/"}>
          Go to {user ? "my workspace" : "home"}
        </Link>
      </div>
    </main>
  );
}
function AppRoutes() {
  return (
    <Suspense
      fallback={
        <main className="page-wrap">
          <Skeleton />
        </main>
      }
    >
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Protected role={["EMPLOYEE"]} />}>
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/plan/:goalId" element={<PlanPage />} />
          <Route path="/check-ins" element={<CheckInsPage />} />
        </Route>
        <Route element={<Protected role={["MANAGER"]} />}>
          <Route path="/team" element={<TeamPage />} />
          <Route path="/team/:employeeId" element={<TeamPage />} />
          <Route path="/team/check-ins" element={<TeamCheckInsPage />} />
        </Route>
        <Route element={<Protected role={["ADMIN"]} />}>
          <Route path="/admin/:section" element={<AdminPage />} />
        </Route>
        <Route element={<Protected role={["MANAGER", "ADMIN"]} />}>
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        <Route element={<Protected role={["EMPLOYEE", "MANAGER"]} />}>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </SessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
