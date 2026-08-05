import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollText, Loader2, ShieldCheck, AlertTriangle, Banknote, Scale } from "lucide-react";

interface AuditRow {
  id: string;
  admin_id: string;
  admin_name: string | null;
  action_type: string;
  target_session_id: string | null;
  target_user_id: string | null;
  description: string;
  details: any;
  created_at: string;
}

const ACTION_META: Record<string, { label: string; className: string; Icon: any }> = {
  deposit_confirmed: { label: "Deposit Confirmed", className: "bg-success/15 text-success border-success/30", Icon: ShieldCheck },
  deposit_rejected: { label: "Deposit Rejected", className: "bg-destructive/15 text-destructive border-destructive/30", Icon: AlertTriangle },
  dispute_resolved: { label: "Dispute Action", className: "bg-warning/15 text-warning border-warning/30", Icon: Scale },
  status_override: { label: "Status Override", className: "bg-warning/15 text-warning border-warning/30", Icon: Scale },
  winnings_released: { label: "Winnings Released", className: "bg-primary/15 text-primary border-primary/30", Icon: Banknote },
  payout_marked_paid: { label: "Payout Paid", className: "bg-primary/15 text-primary border-primary/30", Icon: Banknote },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "deposit_confirmed", label: "Deposits" },
  { value: "dispute_resolved", label: "Disputes" },
  { value: "winnings_released", label: "Winnings" },
];

export default function AuditLogTab() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchLog = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    setRows((data || []) as any as AuditRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLog();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchFilter =
        filter === "all" ||
        r.action_type === filter ||
        (filter === "dispute_resolved" && r.action_type === "status_override") ||
        (filter === "winnings_released" && r.action_type === "payout_marked_paid") ||
        (filter === "deposit_confirmed" && r.action_type === "deposit_rejected");
      if (!matchFilter) return false;
      if (!q) return true;
      return (
        r.description.toLowerCase().includes(q) ||
        (r.admin_name || "").toLowerCase().includes(q) ||
        r.action_type.toLowerCase().includes(q)
      );
    });
  }, [rows, filter, search]);

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" /> Admin Audit Log
        </h2>
        <Button size="sm" variant="outline" onClick={fetchLog} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Permanent, tamper-proof record of every deposit confirmation, dispute action and winnings release.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            className="text-xs h-8"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Input
        placeholder="Search by admin, action or description…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-9 text-sm"
      />

      {loading ? (
        <div className="gradient-card rounded-lg p-6 text-center text-sm text-muted-foreground">Loading audit log…</div>
      ) : visible.length === 0 ? (
        <div className="gradient-card rounded-lg p-6 text-center text-sm text-muted-foreground">
          No audit entries recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((r) => {
            const meta = ACTION_META[r.action_type] || {
              label: r.action_type,
              className: "bg-secondary text-muted-foreground border-border",
              Icon: ScrollText,
            };
            const Icon = meta.Icon;
            return (
              <div key={r.id} className="gradient-card rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge className={`${meta.className} text-[10px]`}>
                    <Icon className="h-3 w-3 mr-1" /> {meta.label}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm text-foreground">{r.description}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                  <span>
                    Admin: <span className="text-foreground font-bold">{r.admin_name || r.admin_id.slice(0, 8)}</span>
                  </span>
                  {r.target_session_id && <span>Session: {r.target_session_id.slice(0, 8)}…</span>}
                  {r.target_user_id && <span>User: {r.target_user_id.slice(0, 8)}…</span>}
                </div>
                {r.details && Object.keys(r.details).length > 0 && (
                  <pre className="text-[10px] text-muted-foreground bg-secondary/50 rounded p-2 overflow-x-auto">
                    {JSON.stringify(r.details, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
