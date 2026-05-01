import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Client-side redirect for legacy/moved URLs.
 * Google treats stable JS-based redirects as soft 301s and consolidates link equity to the target.
 * Use <Navigate replace> so the legacy URL doesn't pollute browser history.
 */
export default function LegacyRedirect({ to }: { to: string }) {
  const location = useLocation();

  useEffect(() => {
    // Hint to crawlers/analytics that this is a permanent move
    document.title = "Redirecting…";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, follow";
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  // Preserve query string when redirecting
  return <Navigate to={`${to}${location.search}`} replace />;
}
