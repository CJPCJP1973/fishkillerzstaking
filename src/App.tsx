import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import GeoBlock from "@/components/GeoBlock";
import Index from "./pages/Index";
import Sessions from "./pages/Sessions";
import VipSessions from "./pages/VipSessions";
import CreateSession from "./pages/CreateSession";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import SiteRules from "./pages/SiteRules";
import Settings from "./pages/Settings";
import Leaderboard from "./pages/Leaderboard";
import PublicProfile from "./pages/PublicProfile";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const [geoBlocked, setGeoBlocked] = useState(false);
  const [blockedRegion, setBlockedRegion] = useState("");
  const [geoChecked, setGeoChecked] = useState(false);

  useEffect(() => {
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
      .finally(() => setGeoChecked(true));
  }, []);

  if (!geoChecked) return null;
  if (geoBlocked) return <GeoBlock region={blockedRegion} />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
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
          </AuthProvider>
        </BrowserRouter>
        <SpeedInsights />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
