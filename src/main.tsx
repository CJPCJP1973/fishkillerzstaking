import { createRoot } from "react-dom/client";
import App from "./App.tsx";
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

void clearLegacyOfflineCache();

createRoot(document.getElementById("root")!).render(<App />);
