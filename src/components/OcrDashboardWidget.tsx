import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Eye, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface ScanEntry {
  id: string;
  session_id: string;
  start_amount: number | null;
  end_amount: number | null;
  confidence: number | null;
  auto_flagged: boolean;
  created_at: string;
  session_shooter?: string;
  session_status?: string;
}

export default function OcrDashboardWidget() {
  const { isAdmin } = useAuth();
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const enrichScans = async (rawScans: any[]): Promise<ScanEntry[]> => {
    const sessionIds = [...new Set(rawScans.map((s) => s.session_id))];
    if (sessionIds.length === 0) return [];
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, shooter_name, status")
      .in("id", sessionIds);
    const sessionMap = new Map(
      (sessions || []).map((s: any) => [s.id, { name: s.shooter_name, status: s.status }])
    );
    return rawScans.map((scan) => ({
      ...scan,
      session_shooter: sessionMap.get(scan.session_id)?.name || "Unknown",
      session_status: sessionMap.get(scan.session_id)?.status || "unknown",
    }));
  };

  useEffect(() => {
    if (!isAdmin) return;

    const fetchInitial = async () => {
      const { data } = await supabase
        .from("ocr_scan_history" as any)
        .select("id, session_id, start_amount, end_amount, confidence, auto_flagged, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setScans(await enrichScans(data as any[]));
      setLoading(false);
    };
    fetchInitial();

    const channel = supabase
      .channel("ocr-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ocr_scan_history" },
        async (payload) => {
          const enriched = await enrichScans([payload.new]);
          setScans((prev) => [...enriched, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  if (!isAdmin) return null;

  const flaggedCount = scans.filter((s) => s.auto_flagged).length;
  const avgConfidence =
    scans.length > 0
      ? Math.round(scans.reduce((sum, s) => sum + (s.confidence || 0), 0) / scans.length)
      : 0;

  return (
    <div className="gradient-card rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
          <Eye className="h-4 w-4 text-primary" />
          OCR Scan Monitor
        </h3>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary rounded-md p-2 text-center">
          <p className="text-lg font-display font-bold text-foreground">{scans.length}</p>
          <p className="text-[10px] text-muted-foreground">Recent Scans</p>
        </div>
        <div className="bg-secondary rounded-md p-2 text-center">
          <p className={`text-lg font-display font-bold ${flaggedCount > 0 ? "text-destructive" : "text-success"}`}>
            {flaggedCount}
          </p>
          <p className="text-[10px] text-muted-foreground">Flagged</p>
        </div>
        <div className="bg-secondary rounded-md p-2 text-center">
          <p className={`text-lg font-display font-bold ${
            avgConfidence >= 80 ? "text-success" : avgConfidence >= 50 ? "text-accent" : "text-destructive"
          }`}>
            {avgConfidence}%
          </p>
          <p className="text-[10px] text-muted-foreground">Avg Confidence</p>
        </div>
      </div>

      {/* Recent scans list */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading scans…</p>
      ) : scans.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">No OCR scans yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-y-auto">
          {scans.map((scan) => {
            const confColor =
              scan.confidence == null ? "text-muted-foreground"
              : scan.confidence >= 80 ? "text-success"
              : scan.confidence >= 50 ? "text-accent"
              : "text-destructive";

            return (
              <div
                key={scan.id}
                className={`rounded border p-2 text-[11px] ${
                  scan.auto_flagged
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-border bg-background/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {scan.auto_flagged ? (
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    ) : (
                      <CheckCircle className="h-3 w-3 text-success" />
                    )}
                    <span className="font-display font-bold text-foreground">
                      {scan.session_shooter}
                    </span>
                    {scan.auto_flagged && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 bg-destructive/20 text-destructive border-destructive/30">
                        FLAGGED
                      </Badge>
                    )}
                    {scan.session_status === "disputed" && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 bg-accent/20 text-accent border-accent/30">
                        DISPUTED
                      </Badge>
                    )}
                  </div>
                  <span className={`font-display font-bold ${confColor}`}>
                    {scan.confidence != null ? `${scan.confidence}%` : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5 text-muted-foreground">
                  <div className="flex gap-2">
                    <span>Start: <span className="text-foreground">{scan.start_amount != null ? `$${Number(scan.start_amount).toLocaleString()}` : "—"}</span></span>
                    <span>End: <span className="text-foreground">{scan.end_amount != null ? `$${Number(scan.end_amount).toLocaleString()}` : "—"}</span></span>
                  </div>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(scan.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
