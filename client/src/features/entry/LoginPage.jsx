import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSession } from "../../App";
import { BRAND } from "../../lib/brand";
import { Button, Field, Input } from "../../ui";

export default function LoginPage() {
  const { login } = useSession();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [visible, setVisible] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password, params.get("next"));
    } catch (failure) {
      setError(
        `${failure.message} Check your email and password, then try again.`,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <header className="entry-header">
        <Link to="/" className="wordmark" translate="no">
          <span className="brand-mark" aria-hidden="true" />
          {BRAND}
        </Link>
        <Link to="/">About Goal tracker</Link>
      </header>
      <div className="login-center">
        <div className="login-intro">
          <h1>Sign in to your workspace</h1>
          <p className="page-intro">
            Your plan, team reviews, and quarterly progress are ready where you
            left them.
          </p>
        </div>
        <form className="panel panel-pad login-form" onSubmit={submit}>
          <Field label="Email address">
            <Input
              name="email"
              type="email"
              autoComplete="username"
              spellCheck="false"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <div className="password-row">
              <Input
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <Button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible((value) => !value)}
              >
                {visible ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </Button>
            </div>
          </Field>
          {error && (
            <p className="error-text" role="alert" aria-live="polite">
              {error}
            </p>
          )}
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          {import.meta.env.VITE_DEMO_MODE === "true" && (
            <div className="demo-accounts">
              <strong>Try a demo account</strong>
              <p>All demo accounts use Password123!</p>
              {["employee", "manager", "admin"].map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setEmail(`${role}@atomberg.local`)}
                >
                  {role}@atomberg.local
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
