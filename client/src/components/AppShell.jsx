import { BarChart3, CalendarCheck2, ClipboardCheck, LogOut, ShieldCheck, Users } from "lucide-react";

export const navigationByRole = {
  EMPLOYEE: [
    { id: "plan", label: "Goal plan", icon: ClipboardCheck },
    { id: "check-ins", label: "Check-ins", icon: CalendarCheck2 }
  ],
  MANAGER: [
    { id: "team", label: "Team review", icon: Users },
    { id: "team-check-ins", label: "Team check-ins", icon: CalendarCheck2 },
    { id: "reports", label: "Reports", icon: BarChart3 }
  ],
  ADMIN: [
    { id: "administration", label: "Administration", icon: ShieldCheck },
    { id: "reports", label: "Reports", icon: BarChart3 }
  ]
};

function NavigationButton({ item, active, onNavigate, compact = false }) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={`${compact ? "min-h-14 flex-1 flex-col justify-center px-2 text-xs" : "w-full px-3 py-2.5 text-left text-sm"} flex items-center gap-2 rounded-lg font-medium transition ${
        active ? "bg-blue-50 text-corporate-blue" : "text-slate-600 hover:bg-slate-50 hover:text-corporate-navy"
      }`}
      onClick={() => onNavigate(item.id)}
      type="button"
    >
      <item.icon aria-hidden="true" size={18} />
      <span>{item.label}</span>
    </button>
  );
}

export function AppShell({ portalLabel, user, activeView, onNavigate, onLogout, children }) {
  const navigation = navigationByRole[user.role] ?? [];
  const activeItem = navigation.find((item) => item.id === activeView);

  return (
    <div className="min-h-screen bg-corporate-surface">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-68 border-r border-corporate-line bg-white lg:block">
        <div className="flex h-16 items-center border-b border-corporate-line px-6">
          <div>
            <p className="text-base font-semibold text-corporate-navy">GoalTrack HR</p>
            <p className="text-xs text-slate-500">Performance Operations</p>
          </div>
        </div>
        <nav aria-label="Primary navigation" className="space-y-1 px-3 py-5">
          {navigation.map((item) => (
            <NavigationButton active={item.id === activeView} item={item} key={item.id} onNavigate={onNavigate} />
          ))}
        </nav>
      </aside>

      <div className="lg:pl-68">
        <header className="sticky top-0 z-10 border-b border-corporate-line bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-medium text-slate-500">{portalLabel}</p>
              <h1 className="text-lg font-semibold text-corporate-navy sm:text-xl">{activeItem?.label}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-corporate-navy">{user.name}</p>
                <p className="text-xs text-slate-500">{user.title} · {user.role}</p>
              </div>
              <button
                aria-label="Sign out"
                className="rounded-lg border border-corporate-line bg-white p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-corporate-blue"
                onClick={onLogout}
                type="button"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
        <main className="px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
      </div>
      <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-20 flex gap-1 border-t border-corporate-line bg-white px-2 py-1 lg:hidden">
        {navigation.map((item) => (
          <NavigationButton active={item.id === activeView} compact item={item} key={item.id} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  );
}
