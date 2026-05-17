import { BarChart3, ClipboardCheck, Home, LayoutDashboard, Settings, ShieldCheck, Users } from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: Home, active: true },
  { label: "Employee Goals", icon: ClipboardCheck },
  { label: "Manager Review", icon: Users },
  { label: "Reports", icon: BarChart3 },
  { label: "Administration", icon: ShieldCheck },
  { label: "Settings", icon: Settings }
];

export function AppShell({ onNavigateHome, children }) {
  return (
    <div className="min-h-screen bg-corporate-surface">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-68 border-r border-corporate-line bg-white lg:block">
        <div className="flex h-16 items-center border-b border-corporate-line px-6">
          <div>
            <p className="text-base font-semibold text-corporate-navy">GoalTrack HR</p>
            <p className="text-xs text-slate-500">Performance Operations</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-5">
          {navigation.map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                item.active
                  ? "bg-blue-50 text-corporate-blue"
                  : "text-slate-600 hover:bg-slate-50 hover:text-corporate-navy"
              }`}
              type="button"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-68">
        <header className="sticky top-0 z-10 border-b border-corporate-line bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-medium text-slate-500">Goal Setting & Tracking Portal</p>
              <h1 className="text-lg font-semibold text-corporate-navy sm:text-xl">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-corporate-navy">Phase 1 Workspace</p>
                <p className="text-xs text-slate-500">Architecture preview</p>
              </div>
              <button
                aria-label="Back to landing page"
                className="rounded-lg border border-corporate-line bg-white p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-corporate-blue"
                onClick={onNavigateHome}
                type="button"
              >
                <LayoutDashboard size={18} />
              </button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
