import Layout from "@/components/Layout";
import { Shield, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pendingActions = [
  { id: 1, type: "deposit", user: "BackerJoe", amount: 250, session: "AceHunter99 - Golden Dragon", time: "3m ago" },
  { id: 2, type: "deposit", user: "StakeKing", amount: 500, session: "DeepSeaKing - Fire Phoenix", time: "8m ago" },
  { id: 3, type: "release", user: "AceHunter99", amount: 1250, session: "Golden Dragon Session #7", time: "1h ago" },
];

export default function Admin() {
  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-accent" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manual Escrow & Session Management</p>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-foreground">Pending Actions</h2>
          {pendingActions.map((action) => (
            <div key={action.id} className="gradient-card rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${action.type === "deposit" ? "bg-primary/20" : "bg-accent/20"}`}>
                  {action.type === "deposit" ? (
                    <DollarSign className="h-4 w-4 text-primary" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-accent" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {action.type === "deposit" ? "Confirm Deposit" : "Release Winnings"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {action.user} • ${action.amount.toLocaleString()} • {action.session}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{action.time}</span>
                <Button size="sm" className="gradient-primary text-primary-foreground font-display font-bold text-xs">
                  {action.type === "deposit" ? "CONFIRM" : "RELEASE"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
