import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const clearLegacyOfflineCache = async () => {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const cacheKeys = await window.caches.keys();
    const legacyCacheKeys = cacheKeys.filter(
      (key) => key.includes("workbox") || key.includes("precache") || key.includes("runtime")
    );

    await Promise.allSettled(legacyCacheKeys.map((key) => window.caches.delete(key)));
  }
};

const clearPersistedAuthState = () => {
  if (typeof window === "undefined") return;

  const authKeyPattern = /^(sb-|supabase\.auth\.|sb-pkce-)/i;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const keys: string[] = [];

      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key && authKeyPattern.test(key)) keys.push(key);
      }

      keys.forEach((key) => storage.removeItem(key));
    } catch {
      // Ignore storage access failures and continue startup recovery.
    }
  }
};

const normalizeError = (reason: unknown) =>
  reason instanceof Error ? reason : new Error(typeof reason === "string" ? reason : "Unknown startup error");

// Collect boot errors for the diagnostic panel
const bootErrors: { time: string; message: string; stack?: string }[] = [];
const pushBootError = (err: Error) => {
  bootErrors.push({
    time: new Date().toISOString(),
    message: err.message,
    stack: err.stack?.split("\n").slice(0, 6).join("\n"),
  });
};

function StartupScreen({ retrying }: { retrying: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h1 className="font-display text-2xl font-bold">
          {retrying ? "Recovering startup…" : "Starting FishKillerz…"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {retrying
            ? "Refreshing cached app state to get you back in."
            : "Loading the latest app shell."}
        </p>
      </div>
    </div>
  );
}

function ErrorLogPanel() {
  if (bootErrors.length === 0) return null;
  return (
    <details className="mt-4 w-full text-left" open>
      <summary className="cursor-pointer text-xs font-bold text-destructive">
        🔍 Boot diagnostics ({bootErrors.length} error{bootErrors.length > 1 ? "s" : ""})
      </summary>
      <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 font-mono text-[11px] leading-relaxed text-destructive">
        {bootErrors.map((e, i) => (
          <div key={i} className={i > 0 ? "mt-3 border-t border-destructive/20 pt-3" : ""}>
            <p className="font-bold">[{e.time}]</p>
            <p>{e.message}</p>
            {e.stack && (
              <pre className="mt-1 whitespace-pre-wrap break-all text-destructive/70">{e.stack}</pre>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}

function FatalStartupScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
        <h1 className="font-display text-2xl font-bold">App failed to start</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We cleared stale cached state, but this browser still has an old copy stuck.
        </p>
        <ErrorLogPanel />
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Reload app
          </button>
          <button
            type="button"
            onClick={() => {
              clearPersistedAuthState();
              window.location.reload();
            }}
            className="rounded-md border border-border bg-secondary px-4 py-2 font-semibold text-foreground transition-colors hover:bg-secondary/80"
          >
            Reset startup state
          </button>
        </div>
      </div>
    </div>
  );
}
function BootReady({ children }: { children: ReactNode }) {
  useEffect(() => {
    bootCompleted = true;

    return () => {
      bootCompleted = false;
    };
  }, []);

  return <>{children}</>;
}

class BootErrorBoundary extends Component<
  { children: ReactNode; onStartupError: (error: Error) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onStartupError(error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

let bootCompleted = false;
let bootRetryUsed = false;
let startupRecoveryInProgress = false;

const recoverStartup = async (reason: unknown) => {
  if (startupRecoveryInProgress) return;

  startupRecoveryInProgress = true;
  bootCompleted = false;

  const error = normalizeError(reason);
  pushBootError(error);
  console.error("Startup recovery triggered", error);

  if (!bootRetryUsed) {
    bootRetryUsed = true;
    root.render(<StartupScreen retrying />);
    clearPersistedAuthState();
    await clearLegacyOfflineCache();
    startupRecoveryInProgress = false;
    await mountApp();
    return;
  }

  root.render(<FatalStartupScreen />);
  startupRecoveryInProgress = false;
};

const mountApp = async () => {
  try {
    root.render(<StartupScreen retrying={bootRetryUsed} />);
    await clearLegacyOfflineCache();

    const { default: App } = await import("./App.tsx");

    root.render(
      <BootErrorBoundary onStartupError={(error) => void recoverStartup(error)}>
        <BootReady>
          <App />
        </BootReady>
      </BootErrorBoundary>
    );
  } catch (error) {
    await recoverStartup(error);
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (!bootCompleted) {
      void recoverStartup(event.error ?? new Error(event.message));
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!bootCompleted) {
      void recoverStartup(event.reason);
    }
  });
}

void mountApp();

