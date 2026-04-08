import { useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import GeoBlock from "@/components/GeoBlock";
import Index from "./pages/Index";
import Sessions from "./pages/Sessions";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Admin from "./pages/Admin";

const Settings = lazy(() => import("./pages/Settings"));
const CreateSession = lazy(() => import("./pages/CreateSession"));
const Profile = lazy(() => import("./pages/Profile"));
const VipSessions = lazy(() => import("./pages/VipSessions"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Terms = lazy(() => import("./pages/Terms"));
const SiteRules = lazy(() => import("./pages/SiteRules"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient();

const App = () => {
  const [geoBlocked, setGeoBlocked] = useState(false);
  const [blockedRegion, setBlockedRegion] = useState("");
  const [geoChecked, setGeoChecked] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setGeoChecked(true), 1500);
    supabase.functions
      .invoke("check-geo")
      .then(({ data }) => {
        if (data?.blocked) {
          setGeoBlocked(true);
          setBlockedRegion(data.region || "your state");
        }
      })
      .catch(() => {
        // Fail open — don't block on error
      })
      .finally(() => {
        clearTimeout(timeout);
        setGeoChecked(true);
      });
  }, []);

  if (!geoChecked) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
  if (geoBlocked) return <GeoBlock region={blockedRegion} />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/vip-sessions" element={<VipSessions />} />
                <Route path="/create" element={<CreateSession />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/site-rules" element={<SiteRules />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/u/:username" element={<PublicProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
        <SpeedInsights />
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
