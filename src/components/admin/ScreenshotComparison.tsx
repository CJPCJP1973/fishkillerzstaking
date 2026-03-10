import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Loader2, Eye, Ban, ShieldAlert, History } from "lucide-react";
import { computeFileHash } from "@/lib/fileHash";
import { Badge } from "@/components/ui/badge";

interface ScanRecord {
  id: string;
  start_amount: number | null;
  end_amount: number | null;
  confidence: number | null;
  auto_flagged: boolean;
  created_at: string;
}

interface Props {
  sessionId: string;
  startScreenshotUrl?: string | null;
  endScreenshotUrl?: string | null;
  ocrStartAmount?: number | null;
  ocrEndAmount?: number | null;
  ocrConfidence?: number | null;
  shooterId?: string;
  shooterName?: string;
  onUpdate: () => void;
  onBanned?: () => void;
}

export default function ScreenshotComparison({
  sessionId,
  startScreenshotUrl,
  endScreenshotUrl,
  ocrStartAmount,
  ocrEndAmount,
  ocrConfidence,
  shooterId,
  shooterName,
  onUpdate,
  onBanned,
}: Props) {
  const [uploading, setUploading] = useState<"start" | "end" | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [banning, setBanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchScanHistory = useCallback(async () => {
    const { data } = await supabase
      .from("ocr_scan_history" as any)
      .select("id, start_amount, end_amount, confidence, auto_flagged, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });
    if (data) setScanHistory(data as any);
  }, [sessionId]);

  useEffect(() => {
    fetchScanHistory();
  }, [fetchScanHistory]);

  const handleUpload = async (type: "start" | "end", file: File) => {
    setUploading(type);
    try {
      // Hash check — prevent recycled screenshots
      const hash = await computeFileHash(file);
      const { data: existing } = await supabase
        .from("screenshot_hashes" as any)
        .select("session_id, upload_type")
        .eq("file_hash", hash)
        .maybeSingle();
      if (existing) {
        toast.error("This screenshot has already been used on the platform. Duplicate uploads are blocked.");
        setUploading(null);
        return;
      }

      const path = `${sessionId}/${type}-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadErr } = await supabase.storage
        .from("session-screenshots")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const col = type === "start" ? "start_screenshot_url" : "end_screenshot_url";
      await supabase.from("sessions").update({ [col]: path } as any).eq("id", sessionId);

      // Record hash to prevent reuse
      await supabase.from("screenshot_hashes" as any).insert({
        file_hash: hash,
        session_id: sessionId,
        upload_type: `${type}_screenshot`,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      } as any);

      toast.success(`${type === "start" ? "Start" : "End"} screenshot uploaded — running AI scan...`);
      onUpdate();

      // Auto-trigger OCR analysis after upload
      const currentStart = type === "start" ? path : startScreenshotUrl;
      const currentEnd = type === "end" ? path : endScreenshotUrl;
      if (currentStart || currentEnd) {
        await runOcrWithPaths(currentStart || null, currentEnd || null);
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(null);
  };

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("session-screenshots")
      .createSignedUrl(storagePath, 300);
    if (error) return null;
    return data.signedUrl;
  };

  const [startSignedUrl, setStartSignedUrl] = useState<string | null>(null);
  const [endSignedUrl, setEndSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (startScreenshotUrl) getSignedUrl(startScreenshotUrl).then(setStartSignedUrl);
    else setStartSignedUrl(null);
    if (endScreenshotUrl) getSignedUrl(endScreenshotUrl).then(setEndSignedUrl);
    else setEndSignedUrl(null);
  }, [startScreenshotUrl, endScreenshotUrl]);

  const runOcrWithPaths = async (startPath: string | null, endPath: string | null) => {
    if (!startPath && !endPath) return;
    setAnalyzing(true);
    try {
      const startUrl = startPath ? await getSignedUrl(startPath) : null;
      const endUrl = endPath ? await getSignedUrl(endPath) : null;

      const { data, error } = await supabase.functions.invoke("analyze-screenshot", {
        body: {
          start_screenshot_url: startUrl,
          end_screenshot_url: endUrl,
        },
      });
      if (error) throw error;

      const updateData: any = {
        ocr_start_amount: data.start_amount,
        ocr_end_amount: data.end_amount,
        ocr_confidence: data.confidence,
      };

      // Auto-flag as disputed if confidence is critically low
      if (data.confidence != null && data.confidence < 30) {
        updateData.status = "disputed";
        // Log auto-flag to journal
        const adminUser = (await supabase.auth.getUser()).data.user;
        await supabase.from("session_journal").insert({
          session_id: sessionId,
          user_id: adminUser?.id || null,
          author_name: "System",
          message: `⚠️ AUTO-FLAGGED: AI screenshot analysis returned ${data.confidence}% confidence. Session automatically flagged as DISPUTED for manual review.`,
          entry_type: "system",
        } as any);
        
        // Increment fraud_flags on shooter's profile and notify
        if (shooterId) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("fraud_flags")
            .eq("user_id", shooterId)
            .single();
          const currentFlags = Number((prof as any)?.fraud_flags ?? 0);
          await supabase
            .from("profiles")
            .update({ fraud_flags: currentFlags + 1 } as any)
            .eq("user_id", shooterId);

          await supabase.from("notifications").insert({
            user_id: shooterId,
            title: "Session Flagged ⚠️",
            message: `Your session has been automatically flagged for review due to low screenshot verification confidence (${data.confidence}%). Fraud flag #${currentFlags + 1} recorded.`,
            type: "warning",
          } as any);
        }

        toast.warning(`OCR: ${data.confidence}% confidence — Session auto-flagged as DISPUTED`);
      } else {
        toast.success(`OCR complete — Confidence: ${data.confidence}%`);
      }

      await supabase.from("sessions").update(updateData).eq("id", sessionId);

      // Log to scan history
      const adminUser = data.confidence != null ? (await supabase.auth.getUser()).data.user : null;
      await supabase.from("ocr_scan_history" as any).insert({
        session_id: sessionId,
        scanned_by: adminUser?.id || "00000000-0000-0000-0000-000000000000",
        start_amount: data.start_amount ?? null,
        end_amount: data.end_amount ?? null,
        confidence: data.confidence ?? null,
        auto_flagged: data.confidence != null && data.confidence < 30,
      } as any);

      fetchScanHistory();
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "OCR analysis failed");
    }
    setAnalyzing(false);
  };

  const runOcr = () => runOcrWithPaths(startScreenshotUrl || null, endScreenshotUrl || null);

  const handleBlacklistShooter = async () => {
    if (!shooterId) {
      toast.error("Shooter info not available");
      return;
    }
    const confirmed = window.confirm(
      `⚠️ BLACKLIST "${shooterName || "this shooter"}"?\n\nThis will:\n• Ban them from the platform\n• Revoke seller access\n• Flag session as DISPUTED\n\nThis action is immediate.`
    );
    if (!confirmed) return;

    setBanning(true);
    try {
      // 1. Ban the user and increment fraud_flags
      const { data: prof } = await supabase
        .from("profiles")
        .select("fraud_flags")
        .eq("user_id", shooterId)
        .single();
      const currentFlags = Number((prof as any)?.fraud_flags ?? 0);
      await supabase
        .from("profiles")
        .update({ seller_status: "banned", fraud_flags: currentFlags + 1 } as any)
        .eq("user_id", shooterId);

      // 2. Remove seller role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", shooterId)
        .eq("role", "seller" as any);

      // 3. Flag this session as disputed
      await supabase
        .from("sessions")
        .update({ status: "disputed" } as any)
        .eq("id", sessionId);

      // 4. Log to session journal
      const adminUser = (await supabase.auth.getUser()).data.user;
      await supabase.from("session_journal").insert({
        session_id: sessionId,
        user_id: adminUser?.id || null,
        author_name: "Admin",
        message: `🚫 BLACKLISTED: ${shooterName || "Shooter"} banned for uploading doctored/fraudulent screenshots. Session flagged as DISPUTED.`,
        entry_type: "system",
      } as any);

      // 5. Notify the user
      await supabase.from("notifications").insert({
        user_id: shooterId,
        title: "Account Banned 🚫",
        message: "Your account has been banned for uploading doctored or fraudulent screenshots. If you believe this is an error, contact support.",
        type: "error",
      } as any);

      toast.success(`${shooterName || "Shooter"} has been blacklisted and session flagged as disputed`);
      onUpdate();
      onBanned?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to blacklist shooter");
    }
    setBanning(false);
  };

  const confidenceColor =
    ocrConfidence == null
      ? "text-muted-foreground"
      : ocrConfidence >= 80
      ? "text-success"
      : ocrConfidence >= 50
      ? "text-accent"
      : "text-destructive";

  return (
    <div className="bg-secondary rounded-md p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-display font-bold text-foreground flex items-center gap-1.5">
          <Eye className="h-4 w-4 text-primary" /> Screenshot Verification
        </Label>
        {ocrConfidence != null && (
          <span className={`text-xs font-display font-bold ${confidenceColor}`}>
            AI Confidence: {ocrConfidence}%
          </span>
        )}
      </div>

      {/* Side-by-side screenshots */}
      <div className="grid grid-cols-2 gap-2">
        {/* Start */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Start</p>
          {startSignedUrl ? (
            <img
              src={startSignedUrl}
              alt="Start screenshot"
              className="rounded border border-border w-full aspect-video object-cover cursor-pointer"
              onClick={() => window.open(startSignedUrl, "_blank")}
            />
          ) : (
            <div className="rounded border border-dashed border-border aspect-video flex items-center justify-center bg-background/50">
              <p className="text-[10px] text-muted-foreground">No image</p>
            </div>
          )}
          {ocrStartAmount != null && (
            <p className="text-xs text-foreground">
              OCR Read: <span className="text-accent font-display font-bold">${ocrStartAmount.toLocaleString()}</span>
            </p>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload("start", e.target.files[0])}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full text-xs"
              disabled={uploading === "start"}
              asChild
            >
              <span>
                {uploading === "start" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3 mr-1" />
                )}
                Upload Start
              </span>
            </Button>
          </label>
        </div>

        {/* End */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">End</p>
          {endSignedUrl ? (
            <img
              src={endSignedUrl}
              alt="End screenshot"
              className="rounded border border-border w-full aspect-video object-cover cursor-pointer"
              onClick={() => window.open(endSignedUrl, "_blank")}
            />
          ) : (
            <div className="rounded border border-dashed border-border aspect-video flex items-center justify-center bg-background/50">
              <p className="text-[10px] text-muted-foreground">No image</p>
            </div>
          )}
          {ocrEndAmount != null && (
            <p className="text-xs text-foreground">
              OCR Read: <span className="text-accent font-display font-bold">${ocrEndAmount.toLocaleString()}</span>
            </p>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload("end", e.target.files[0])}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full text-xs"
              disabled={uploading === "end"}
              asChild
            >
              <span>
                {uploading === "end" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3 mr-1" />
                )}
                Upload End
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Action buttons row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Run OCR button */}
        <Button
          size="sm"
          onClick={runOcr}
          disabled={analyzing || (!startScreenshotUrl && !endScreenshotUrl)}
          className="w-full gradient-primary text-primary-foreground font-display font-bold text-xs"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Analyzing...
            </>
          ) : (
            "🤖 Run AI Analysis"
          )}
        </Button>

        {/* Blacklist / Ban Shooter button */}
        {shooterId && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBlacklistShooter}
            disabled={banning}
            className="w-full font-display font-bold text-xs"
          >
            {banning ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Banning...
              </>
            ) : (
              <>
                <Ban className="h-3 w-3 mr-1" /> Blacklist Shooter
              </>
            )}
          </Button>
        )}
      </div>

      {/* Low confidence warning */}
      {ocrConfidence != null && ocrConfidence < 50 && (
        <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-md p-2.5">
          <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-display font-bold text-destructive">Low Confidence — Possible Tampering</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              AI confidence is below 50%. This may indicate doctored or unreadable screenshots. 
              Review manually and consider blacklisting if evidence of fraud is found.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
