import { useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../../App";
import { BRAND } from "../../lib/brand";
import { Button } from "../../ui";
import { PlanBar } from "../../ui/PlanBar";

const demo = [
  {
    id: "one",
    title: "Improve BLDC motor efficiency",
    weightage: 30,
    status: "APPROVED",
  },
  {
    id: "two",
    title: "Cut service turnaround",
    weightage: 25,
    status: "SUBMITTED",
  },
  {
    id: "three",
    title: "Grow channel sell-through",
    weightage: 20,
    status: "DRAFT",
  },
  {
    id: "four",
    title: "Reduce supplier defects",
    weightage: 10,
    status: "REWORK_REQUIRED",
  },
];
const accounts = [
  {
    role: "employee",
    label: "Open as employee",
    email: "employee@atomberg.local",
  },
  {
    role: "manager",
    label: "Open as manager",
    email: "manager@atomberg.local",
  },
  { role: "admin", label: "Open as HR admin", email: "admin@atomberg.local" },
];
export default function EntryPage() {
  const { login, user } = useSession();
  const [goals, setGoals] = useState(demo),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const total = goals.reduce((sum, goal) => sum + goal.weightage, 0);
  const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
  async function open(account) {
    setBusy(account.role);
    setError("");
    try {
      await login(account.email, "Password123!");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <main className="entry-page">
      <header className="entry-header">
        <Link to="/" className="wordmark" translate="no">
          <span className="brand-mark" aria-hidden="true" />
          {BRAND}
        </Link>
        <Link
          className="btn"
          to={
            user
              ? { EMPLOYEE: "/plan", MANAGER: "/team", ADMIN: "/admin/people" }[
                  user.role
                ]
              : "/login"
          }
        >
          {user ? "Open workspace" : "Sign in"}
        </Link>
      </header>
      <div className="entry-body">
        <div className="entry-copy">
          <h1>One plan. Exactly 100%. A clear review every quarter.</h1>
          <p>
            Set weighted goals, get them approved, and track planned versus
            actual results from Q1 to Q4.
          </p>
          <p className="muted">
            Try moving a boundary in the plan below. This example stays in your
            browser.
          </p>
        </div>
        <section
          className="panel entry-instrument"
          aria-label="Interactive example plan"
        >
          <div className="page-header">
            <div>
              <h2>Example plan</h2>
              <p className="muted">
                Four outcomes for a consumer-appliance team
              </p>
            </div>
            <strong className="display-num">{total}%</strong>
          </div>
          <PlanBar
            goals={goals}
            onChange={setGoals}
            label="Example plan weights"
          />
          <div className="entry-remaining">
            <p>
              {total === 100
                ? "This plan is ready to submit."
                : `${100 - total}% remains to allocate.`}
            </p>
            {total < 100 && (
              <Button
                onClick={() =>
                  setGoals((current) =>
                    current.map((goal, index) =>
                      index === current.length - 1
                        ? {
                            ...goal,
                            weightage:
                              goal.weightage + Math.min(5, 100 - total),
                          }
                        : goal,
                    ),
                  )
                }
              >
                Add 5% to supplier defects
              </Button>
            )}
          </div>
        </section>
        <section className="entry-roles">
          <h2>Choose a view</h2>
          <p className="muted">
            See the work from the perspective that matters to you.
          </p>
          <div className="role-links">
            {accounts.map((account) =>
              demoMode ? (
                <Button
                  key={account.role}
                  disabled={Boolean(busy)}
                  onClick={() => open(account)}
                >
                  {busy === account.role ? "Opening…" : account.label}
                </Button>
              ) : (
                <Link key={account.role} className="btn" to="/login">
                  {account.label}
                </Link>
              ),
            )}
          </div>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
