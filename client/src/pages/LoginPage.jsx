import { LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { apiClient } from "../lib/api";

export function LoginPage({ onAuthenticated }) {
  const [email, setEmail] = useState("employee@atomberg.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { data: result } = await apiClient.post("/auth/login", { email, password });

      onAuthenticated(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-corporate-surface px-4 py-8 lg:grid-cols-[1fr_520px] lg:px-0 lg:py-0">
      <section className="hidden bg-white px-12 py-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-base font-semibold text-corporate-blue">GoalTrack HR</p>
          <h1 className="mt-10 max-w-2xl text-4xl font-semibold leading-tight tracking-normal text-corporate-navy">
            Enterprise goal planning with accountable progress tracking.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            A focused HRMS workspace for employees, managers, and administrators to access role-specific performance operations.
          </p>
        </div>
        <div className="grid max-w-3xl grid-cols-3 gap-4">
          {["Employee Portal", "Manager Reviews", "Admin Controls"].map((item) => (
            <div key={item} className="rounded-lg border border-corporate-line bg-corporate-surface p-4">
              <p className="text-sm font-semibold text-corporate-navy">{item}</p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-200">
                <div className="h-1.5 w-2/3 rounded-full bg-corporate-blue" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center">
        <form className="w-full max-w-md rounded-lg border border-corporate-line bg-white p-8 shadow-soft" onSubmit={handleSubmit}>
          <div>
            <p className="text-sm font-semibold text-corporate-blue">Secure sign in</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-corporate-navy">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Use your corporate credentials to continue.</p>
          </div>

          <label className="mt-8 block">
            <span className="text-sm font-medium text-slate-700">Email address</span>
            <span className="mt-2 flex items-center gap-2 rounded-lg border border-corporate-line bg-white px-3 py-2.5 focus-within:border-corporate-blue focus-within:ring-2 focus-within:ring-blue-100">
              <Mail size={18} className="text-slate-400" />
              <input
                className="w-full border-0 bg-transparent text-sm text-corporate-navy outline-none"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </span>
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <span className="mt-2 flex items-center gap-2 rounded-lg border border-corporate-line bg-white px-3 py-2.5 focus-within:border-corporate-blue focus-within:ring-2 focus-within:ring-blue-100">
              <LockKeyhole size={18} className="text-slate-400" />
              <input
                className="w-full border-0 bg-transparent text-sm text-corporate-navy outline-none"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </span>
          </label>

          {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button
            className="mt-6 w-full rounded-lg bg-corporate-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs leading-6 text-slate-600">
            <p className="font-semibold text-corporate-navy">Demo accounts</p>
            <p>employee@atomberg.local / Password123!</p>
            <p>manager@atomberg.local / Password123!</p>
            <p>admin@atomberg.local / Password123!</p>
          </div>
        </form>
      </section>
    </main>
  );
}
