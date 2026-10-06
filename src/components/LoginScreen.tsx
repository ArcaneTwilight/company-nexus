import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ShieldCheck, Lock, User, Terminal, HelpCircle, Eye, EyeOff } from "lucide-react";
import { getFirebaseAuth, isFirebaseConfigured } from "../lib/firebase";
import {
  getFirebaseAuthEmail,
  getHubPassword,
  getHubUsername,
  isValidHubPassword,
  isValidHubUsername,
  normalizeHubLoginInput,
} from "../lib/hubAuth";
import { transitions, durations } from "../lib/motion";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { ThemeToggle } from "./shared";

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const reduced = useReducedMotion();
  const useFirebase = isFirebaseConfigured();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill out all credentials.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const hubUsername = normalizeHubLoginInput(username);

      if (!isValidHubUsername(username)) {
        setError(`Invalid login. Use the username "${getHubUsername()}".`);
        return;
      }

      if (useFirebase) {
        await signInWithEmailAndPassword(
          getFirebaseAuth(),
          getFirebaseAuthEmail(),
          password
        );
        onLoginSuccess("firebase-auth");
        return;
      }

      if (import.meta.env.PROD) {
        setError(
          "Firebase is not configured for this deployment. Add FIREBASE_* variables in Vercel and redeploy."
        );
        return;
      }

      const offlineFallback =
        hubUsername === getHubUsername() && isValidHubPassword(password);

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: hubUsername, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          onLoginSuccess(data.token);
          return;
        }

        if (offlineFallback) {
          onLoginSuccess("offline-demo-session");
          return;
        }

        setError(data.message || "Access Denied. Please verify credentials.");
      } catch (err: unknown) {
        console.error("Login request failed:", err);
        if (offlineFallback) {
          onLoginSuccess("offline-demo-session");
          return;
        }

        const firebaseCode = (err as { code?: string })?.code;
        if (firebaseCode === "auth/invalid-credential" || firebaseCode === "auth/wrong-password") {
          setError("Invalid username or password.");
        } else if (firebaseCode === "auth/user-not-found") {
          setError("Hub account not found in Firebase. Check FIREBASE_AUTH_EMAIL matches your Firebase user.");
        } else {
          setError("Unable to connect to the authorization server. Use the demo credentials to run offline.");
        }
      }
    } catch (err: unknown) {
      console.error("Firebase sign-in failed:", err);
      const code =
        err && typeof err === "object" && "code" in err && typeof err.code === "string"
          ? err.code
          : "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/invalid-password") {
        setError("Invalid Firebase email or password.");
      } else if (code === "auth/user-not-found") {
        setError("The configured Firebase email does not have an account in this project.");
      } else if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
        setError("Email/Password sign-in is not enabled for this Firebase project.");
      } else if (code === "auth/unauthorized-domain") {
        setError("This website domain is not authorized in Firebase Authentication settings.");
      } else {
        setError("Firebase sign-in failed. Check the account, Firebase configuration, and connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_screen_container" className="min-h-screen flex items-center justify-center bg-ambient p-4 relative overflow-hidden font-sans">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durations.reveal, ease: transitions.enter.ease }}
        className="w-full max-w-md glass-container rounded-2xl p-8 border border-border shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={reduced ? { duration: 0 } : transitions.spring}
            className="w-16 h-16 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 mb-4"
          >
            <ShieldCheck className="w-9 h-9 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold font-display text-fg tracking-tight text-center">
            Company Nexus
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={transitions.enter}
                className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-700 dark:text-red-200 text-sm flex gap-2"
              >
                <Terminal className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-semibold text-fg-muted font-mono uppercase tracking-wider mb-2">
              Login
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 h-5 text-fg-muted" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={getHubUsername()}
                className="w-full pl-10 pr-4 py-3 bg-panel border border-border rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none font-sans text-sm input-glass-focus"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-fg-muted font-mono uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 h-5 text-fg-muted" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 bg-panel border border-border rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none font-sans text-sm input-glass-focus"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-fg-muted hover:text-fg transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={reduced || loading ? undefined : { y: -2, boxShadow: "0 8px 24px rgba(56, 189, 248, 0.2)" }}
            whileTap={reduced || loading ? undefined : { scale: 0.98 }}
            transition={{ duration: durations.fast }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-sky-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm glass-button"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{useFirebase ? "Signing in with Firebase..." : "Authenticating with Node Server..."}</span>
              </>
            ) : (
              <span>Authorize</span>
            )}
          </motion.button>
        </form>

        <div className="mt-8 pt-4 border-t border-border flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="text-xs text-fg-muted hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1.5 transition-colors font-mono"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{useFirebase ? "Login Help" : "Need Credentials? Click to view"}</span>
          </button>

          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: 5, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 5, height: 0 }}
                transition={transitions.accordion}
                className="mt-3 p-3.5 rounded-lg bg-panel-solid border border-border text-xs text-fg-muted font-mono w-full leading-relaxed overflow-hidden"
              >
              {useFirebase ? (
                <>
                  <p className="mb-2">
                    Enter the hub username only — the email domain is added automatically.
                  </p>
                  <div className="flex justify-between mb-1">
                    <span>Username:</span>
                    <span className="text-fg font-semibold">{getHubUsername()}</span>
                  </div>
                  <p className="text-[12px] text-fg-subtle mt-2 text-center">
                    Firebase signs in as{" "}
                    <code className="text-fg-muted">{getFirebaseAuthEmail()}</code>
                  </p>
                </>
              ) : (
                <>
                  <div className="flex justify-between border-b border-border pb-1 mb-1.5">
                    <span className="text-fg-muted">Environment keys:</span>
                    <span className="text-sky-700 dark:text-sky-400">Default settings</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Username:</span>
                    <span className="text-fg font-semibold">{getHubUsername()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Password:</span>
                    <span className="text-fg font-semibold">{getHubPassword()}</span>
                  </div>
                  <p className="text-[12px] text-fg-subtle mt-2 text-center">
                    Configure custom values via <code className="text-fg-muted">HUB_USERNAME</code> &{" "}
                    <code className="text-fg-muted">HUB_PASSWORD</code> env variables.
                  </p>
                </>
              )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
