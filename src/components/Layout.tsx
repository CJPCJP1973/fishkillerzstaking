import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Crosshair, Home, Plus, User, Shield, Menu, X, LogOut, LogIn, Crown, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, isSeller, isVip, signOut } = useAuth();

  const navItems = [
    { to: "/", label: "Dashboard", icon: Home, show: true },
    { to: "/sessions", label: "Sessions", icon: Crosshair, show: true },
    { to: "/create", label: "Create", icon: Plus, show: isSeller },
    { to: "/vip-sessions", label: "VIP", icon: Crown, show: isVip },
    { to: "/leaderboard", label: "Ranks", icon: Trophy, show: true },
    { to: "/profile", label: "Profile", icon: User, show: !!user },
    { to: "/admin", label: "Admin", icon: Shield, show: isAdmin },
  ].filter((i) => i.show);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Crosshair className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold tracking-wide text-foreground">
              FISH<span className="text-primary">KILLERZ</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <NotificationBell />
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </nav>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="md:hidden border-t border-border bg-background pb-3">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {user ? (
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false); }}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground w-full"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary">
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/80 py-4 pb-20 md:pb-4">
        <div className="container flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <a
            href="mailto:fishkillerzstaking@gmail.com"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact Support
          </a>
          <Link to="/site-rules" className="hover:text-primary transition-colors">
            Site Rules
          </Link>
          <Link to="/terms" className="hover:text-primary transition-colors">
            Terms
          </Link>
          {isAdmin && (
            <Link to="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Admin Panel
            </Link>
          )}
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
