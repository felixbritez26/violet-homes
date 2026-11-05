import { useEffect, useState } from "react";
import {
  House,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import App from "./App";

async function api(path, csrf, body) {
  const response = await fetch("/api/auth/" + path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers:
      body === undefined
        ? {}
        : { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export default function AuthGate() {
  const resetToken =
    new URLSearchParams(window.location.search).get("reset") || "";
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [user, setUser] = useState(null),
    [csrf, setCsrf] = useState("");
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [name, setName] = useState(""),
    [email, setEmail] = useState("");
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  async function refresh() {
    const data = await api("session");
    setCsrf(data.csrfToken);
    setUser(data.user);
    return data;
  }
  useEffect(() => {
    refresh()
      .catch(() =>
        setError(
          "Cannot reach the backend. Check that pipenv run dev is running.",
        ),
      )
      .finally(() => setReady(true));
  }, []);
  function navigate(next, keepMessage = false) {
    setMode(next);
    setPassword("");
    setConfirm("");
    setError("");
    setVisible(false);
    if (!keepMessage) setMessage("");
    if (next !== "reset")
      window.history.replaceState({}, "", window.location.pathname);
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if ((mode === "register" || mode === "reset") && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const token = csrf || (await refresh()).csrfToken;
      if (mode === "login") {
        const data = await api("login", token, { email, password });
        setCsrf(data.csrfToken);
        setUser(data.user);
        setPassword("");
      } else if (mode === "register") {
        const data = await api("register", token, { name, email, password });
        setMessage(data.message);
        navigate("login", true);
      } else if (mode === "forgot") {
        const data = await api("forgot-password", token, { email });
        setMessage(data.message);
      } else {
        const data = await api("reset-password", token, {
          token: resetToken,
          password,
        });
        setMessage(data.message);
        setUser(null);
        await refresh();
        navigate("login", true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await api("logout", csrf, {});
      setUser(null);
      await refresh();
      navigate("login");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <div className="auth-loading" role="status">
        Opening your space…
      </div>
    );
  if (user && mode !== "reset")
    return (
      <>
        <div className="account-strip">
          <span>Welcome, {user.name}</span>
          <button disabled={busy} onClick={logout}>
            Log out
          </button>
        </div>
        {error && (
          <p className="auth-session-error" role="alert">
            {error}
          </p>
        )}
        <App key={user.id} user={user} />
      </>
    );
  const copy = {
    login: [
      "WELCOME TO YOUR NEXT CHAPTER",
      "Welcome back.",
      "Your next home is waiting.",
      "Log in",
    ],
    register: [
      "MAKE ROOM FOR SOMETHING NEW",
      "Find your place.",
      "Create your account and start exploring.",
      "Create account",
    ],
    forgot: [
      "LET’S GET YOU BACK HOME",
      "Forgot password?",
      "Enter your email to request a reset link.",
      "Request reset link",
    ],
    reset: [
      "A FRESH START",
      "Set a new password.",
      "Choose a new password for your account.",
      "Update password",
    ],
  }[mode];
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <a
          className="brand auth-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("login");
          }}
        >
          <span className="brand-icon">
            <House size={24} />
          </span>
          <span>
            violet<span className="brand-light">homes</span>
          </span>
        </a>
        <div className="auth-art">
          <span className="auth-orbit" />
          <span className="auth-home">
            <House size={65} strokeWidth={1.2} />
          </span>
          <span className="auth-dot" />
        </div>
        <div className="eyebrow">{copy[0]}</div>
        <h1>{copy[1]}</h1>
        <p className="intro">{copy[2]}</p>
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="auth-success" role="status">
            {message}
          </div>
        )}
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </label>
          )}
          {mode !== "reset" && (
            <label>
              Email address
              <div className="auth-field">
                <Mail size={17} />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </label>
          )}
          {mode !== "forgot" && (
            <label>
              Password
              <div className="auth-field">
                <LockKeyhole size={17} />
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={mode === "login" ? 1 : 8}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "login" ? "Your password" : "At least 8 characters"
                  }
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          )}
          {(mode === "register" || mode === "reset") && (
            <label>
              Confirm password
              <input
                name="confirm"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
              />
            </label>
          )}
          {mode === "login" && (
            <button
              type="button"
              className="auth-link forgot-link"
              onClick={() => navigate("forgot")}
            >
              Forgot password?
            </button>
          )}
          <button className="primary auth-submit" disabled={busy}>
            {busy ? "Please wait…" : copy[3]}
            {!busy && <ArrowRight size={17} />}
          </button>
        </form>
        {mode === "login" ? (
          <p className="auth-switch">
            New here?{" "}
            <button className="auth-link" onClick={() => navigate("register")}>
              Create an account
            </button>
          </p>
        ) : (
          <p className="auth-switch">
            <button className="auth-link" onClick={() => navigate("login")}>
              Back to login
            </button>
          </p>
        )}
        {mode === "forgot" && (
          <p className="auth-demo">
            Local demo: reset links appear in the backend terminal. No email is
            sent.
          </p>
        )}
        <p className="auth-footer">Find your kind of place.</p>
      </div>
    </div>
  );
}
