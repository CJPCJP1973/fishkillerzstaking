import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Loader2, CheckCircle, AlertTriangle, Clock, Eye } from "lucide-react";
import { computeFileHash } from "@/lib/fileHash";
import { validateScreenshotTimestamp } from "@/lib/exifDate";

interface Props {
  sessionId: string;
  type: "start" | "end";
  currentUrl: string | null;
  sessionCreatedAt: string;
  sessionEndTime: string;
  onUploaded: () => void;
}

export default function SellerScreenshotUpload({
  sessionId,
  type,
  currentUrl,
  sessionCreatedAt,
  sessionEndTime,
  onUploaded,
}: Props) {
  const { user, username } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [metaWarning, setMetaWarning] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<{ amount: number | null; confidence: number | null } | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const label = type === "start" ? "Start Balance" : "End Balance";

  useEffect(() => {
    if (currentUrl) {
      supabase.storage
        .from("session-screenshots")
        .createSignedUrl(currentUrl, 300)
        .then(({ data }) => setSignedUrl(data?.signedUrl || null));
    } else {
      setSignedUrl(null);
    }
  }, [currentUrl]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setMetaWarning(null);
    try {
      // 1. EXIF metadata timestamp validation
      const metaResult = await validateScreenshotTimestamp(file, sessionCreatedAt, sessionEndTime);
      if (!metaResult.valid) {
        setMetaWarning(metaResult.stripped
          ? "No EXIF timestamp found — metadata may have been stripped."
          : metaResult.message
        );

        await supabase.from("session_journal" as any).insert({
          session_id: sessionId,
          user_id: user.id,
          author_name: "System",
          message: metaResult.stripped
            ? `⚠️ METADATA WARNING: ${label} screenshot uploaded by ${username || "seller"} has no EXIF timestamp.`
            : `⚠️ TIMESTAMP MISMATCH: ${label} screenshot by ${username || "seller"} — ${metaResult.message}`,
          entry_type: "system",
        } as any);

        if (!metaResult.stripped) {
          toast.warning("Screenshot timestamp doesn't match session window — flagged for review.");
        } else {
          toast.warning("No timestamp metadata found. Upload will proceed.");
        }
      }

      // 2. Hash check
      const hash = await computeFileHash(file);
      const { data: existing } = await supabase
        .from("screenshot_hashes" as any)
        .select("session_id, upload_type")
        .eq("file_hash", hash)
        .maybeSingle();
      if (existing) {
        toast.error("This screenshot has already been used. Please upload a unique screenshot.");
        setUploading(false);
        return;
      }

      // 3. Upload file
      const ext = file.name.split(".").pop();
      const path = `${sessionId}/${type}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("session-screenshots")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      // 4. Update session
      const col = type === "start" ? "start_screenshot_url" : "end_screenshot_url";
      await supabase.from("sessions").update({ [col]: path } as any).eq("id", sessionId);

      // 5. Record hash
      await supabase.from("screenshot_hashes" as any).insert({
        file_hash: hash,
        session_id: sessionId,
        upload_type: `${type}_screenshot`,
        uploaded_by: user.id,
      } as any);

      // 6. Log to journal
      await supabase.from("session_journal" as any).insert({
        session_id: sessionId,
        user_id: user.id,
        author_name: username || user.email?.split("@")[0] || "Seller",
        message: `${label} screenshot uploaded: ${file.name}`,
        entry_type: "system",
      } as any);

      toast.success(`${label} screenshot uploaded — running AI scan...`);
      onUploaded();

      // 7. Auto-trigger OCR
      const signedUrlForOcr = await supabase.storage
        .from("session-screenshots")
        .createSignedUrl(path, 300);

      if (signedUrlForOcr.data?.signedUrl) {
        try {
          const body: any = { session_id: sessionId };
          if (type === "start") {
            body.start_screenshot_url = signedUrlForOcr.data.signedUrl;
          } else {
            body.end_screenshot_url = signedUrlForOcr.data.signedUrl;
          }

          const { data: ocrData, error: ocrError } = await supabase.functions.invoke("analyze-screenshot", {
            body,
          });

          if (ocrError) {
            console.error("OCR error:", ocrError);
            toast.error("AI scan failed — admin will review manually.");
          } else {
            const amount = type === "start" ? ocrData.start_amount : ocrData.end_amount;
            const confidence = ocrData.confidence;
            setOcrResult({ amount, confidence });

            // Update session with OCR results
            const updateData: any = {};
            if (type === "start" && ocrData.start_amount != null) {
              updateData.ocr_start_amount = ocrData.start_amount;
            }
            if (type === "end" && ocrData.end_amount != null) {
              updateData.ocr_end_amount = ocrData.end_amount;
            }
            if (confidence != null) {
              updateData.ocr_confidence = confidence;
            }

            // Auto-flag if low confidence
            if (confidence != null && confidence < 30) {
              updateData.status = "disputed";
              await supabase.from("session_journal" as any).insert({
                session_id: sessionId,
                user_id: null,
                author_name: "System",
                message: `⚠️ AUTO-FLAGGED: Seller-uploaded ${type} screenshot — AI confidence ${confidence}%. Session marked DISPUTED.`,
                entry_type: "system",
              } as any);

              await supabase.from("notifications").insert({
                user_id: user.id,
                title: "Session Flagged ⚠️",
                message: `Your ${type} screenshot had low AI verification confidence (${confidence}%). Session flagged for admin review.`,
                type: "warning",
              } as any);

              toast.warning(`AI confidence: ${confidence}% — session flagged for review.`);
            } else {
              toast.success(`AI scan complete — ${confidence}% confidence${amount != null ? `, read $${amount.toLocaleString()}` : ""}`);
            }

            if (Object.keys(updateData).length > 0) {
              await supabase.from("sessions").update(updateData).eq("id", sessionId);
            }

            // Log to scan history
            await supabase.from("ocr_scan_history" as any).insert({
              session_id: sessionId,
              scanned_by: user.id,
              start_amount: type === "start" ? ocrData.start_amount : null,
              end_amount: type === "end" ? ocrData.end_amount : null,
              confidence: confidence ?? null,
              auto_flagged: confidence != null && confidence < 30,
            } as any);
          }
        } catch {
          toast.error("AI scan encountered an error.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
  };

  const confidenceColor =
    ocrResult?.confidence == null
      ? ""
      : ocrResult.confidence >= 80
      ? "text-success"
      : ocrResult.confidence >= 50
      ? "text-accent"
      : "text-destructive";

  return (
    <div className="bg-secondary/50 border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-display font-bold text-foreground flex items-center gap-1.5">
          {currentUrl ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : (
            <Eye className="h-4 w-4 text-primary" />
          )}
          {label} Screenshot
        </p>
        {currentUrl ? (
          <span className="text-[10px] text-success font-display font-bold">✓ Uploaded</span>
        ) : (
          <span className="text-[10px] text-primary font-display font-bold">Required</span>
        )}
      </div>

      {signedUrl && (
        <img
          src={signedUrl}
          alt={`${label} screenshot`}
          className="rounded border border-border w-full aspect-video object-cover cursor-pointer"
          onClick={() => window.open(signedUrl, "_blank")}
        />
      )}

      {ocrResult && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            AI Read: <span className="text-accent font-display font-bold">
              {ocrResult.amount != null ? `$${ocrResult.amount.toLocaleString()}` : "—"}
            </span>
          </span>
          <span className={`font-display font-bold ${confidenceColor}`}>
            {ocrResult.confidence != null ? `${ocrResult.confidence}%` : ""}
          </span>
        </div>
      )}

      {metaWarning && (
        <div className="flex items-start gap-1.5 bg-accent/10 border border-accent/20 rounded p-2">
          <Clock className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
          <p className="text-[10px] text-accent">{metaWarning}</p>
        </div>
      )}

      <label className="cursor-pointer block">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
        <Button
          type="button"
          size="sm"
          variant={currentUrl ? "outline" : "default"}
          className={`w-full text-xs font-display font-bold ${
            !currentUrl ? "gradient-primary text-primary-foreground" : ""
          }`}
          disabled={uploading}
          asChild
        >
          <span>
            {uploading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Camera className="h-3 w-3 mr-1" />
            )}
            {currentUrl ? `Replace ${label}` : `Upload ${label}`}
          </span>
        </Button>
      </label>
    </div>
  );
}
