import { ArrowRight, BarChart3, ClipboardCheck, ShieldCheck } from "lucide-react";

const capabilities = [
  {
    title: "Goal alignment",
    description: "Create one place for employee goals, ownership, and progress visibility.",
    icon: ClipboardCheck
  },
  {
    title: "Manager oversight",
    description: "Give managers a focused dashboard for review cycles and team progress.",
    icon: BarChart3
  },
  {
    title: "Controlled operations",
    description: "Prepare the foundation for secure admin workflows and audit-ready data.",
    icon: ShieldCheck
  }
];

export function LandingPage({ onOpenDashboard }) {
  return (
    <main className="min-h-screen bg-corporate-surface">
      <header className="border-b border-corporate-line bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-base font-semibold text-corporate-navy">GoalTrack HR</p>
            <p className="text-xs text-slate-500">Goal Setting & Tracking Portal</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-corporate-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            onClick={onOpenDashboard}
            type="button"
          >
            Open dashboard
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-corporate-blue">Phase 1 Architecture</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-corporate-navy sm:text-5xl">
            Corporate goal management workspace for performance teams.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            A clean foundation for employees, managers, and HR administrators to manage goal cycles, progress tracking, and future review workflows.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-corporate-blue px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              onClick={onOpenDashboard}
              type="button"
            >
              View dashboard shell
              <ArrowRight size={17} />
            </button>
            <a
              className="rounded-lg border border-corporate-line bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-corporate-blue"
              href="http://localhost:4000/api/health"
            >
              API health check
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between border-b border-corporate-line pb-4">
            <div>
              <p className="text-sm font-semibold text-corporate-navy">Cycle readiness</p>
              <p className="mt-1 text-xs text-slate-500">Frontend and backend foundation</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              Active
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {capabilities.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-lg border border-corporate-line p-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 p-2.5 text-corporate-blue">
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-corporate-navy">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
