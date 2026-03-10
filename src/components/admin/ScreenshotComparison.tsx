import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Loader2, Eye } from "lucide-react";
import { computeFileHash } from "@/lib/fileHash";

interface Props {
  sessionId: string;
  startScreenshotUrl?: string | null;
  endScreenshotUrl?: string | null;
  ocrStartAmount?: number | null;
  ocrEndAmount?: number | null;
  ocrConfidence?: number | null;
  onUpdate: () => void;
}

export default function ScreenshotComparison({
  sessionId,
  startScreenshotUrl,
  endScreenshotUrl,
  ocrStartAmount,
  ocrEndAmount,
  ocrConfidence,
  onUpdate,
}: Props) {
  const [uploading, setUploading] = useState<"start" | "end" | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

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

      // Store the storage path (not a public URL) since bucket is now private
      const col = type === "start" ? "start_screenshot_url" : "end_screenshot_url";
      await supabase.from("sessions").update({ [col]: path } as any).eq("id", sessionId);

      // Record hash to prevent reuse
      await supabase.from("screenshot_hashes" as any).insert({
        file_hash: hash,
        session_id: sessionId,
        upload_type: `${type}_screenshot`,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      } as any);

      toast.success(`${type === "start" ? "Start" : "End"} screenshot uploaded`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(null);
  };

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("session-screenshots")
      .createSignedUrl(storagePath, 300); // 5-minute expiry
    if (error) return null;
    return data.signedUrl;
  };

  const [startSignedUrl, setStartSignedUrl] = useState<string | null>(null);
  const [endSignedUrl, setEndSignedUrl] = useState<string | null>(null);

  // Generate signed URLs when screenshot paths change
  useEffect(() => {
    if (startScreenshotUrl) getSignedUrl(startScreenshotUrl).then(setStartSignedUrl);
    else setStartSignedUrl(null);
    if (endScreenshotUrl) getSignedUrl(endScreenshotUrl).then(setEndSignedUrl);
    else setEndSignedUrl(null);
  }, [startScreenshotUrl, endScreenshotUrl]);

  const runOcr = async () => {
    if (!startScreenshotUrl && !endScreenshotUrl) {
      toast.error("Upload at least one screenshot first");
      return;
    }
    setAnalyzing(true);
    try {
      // Generate fresh signed URLs for the AI to access private screenshots
      const startUrl = startScreenshotUrl ? await getSignedUrl(startScreenshotUrl) : null;
      const endUrl = endScreenshotUrl ? await getSignedUrl(endScreenshotUrl) : null;

      const { data, error } = await supabase.functions.invoke("analyze-screenshot", {
        body: {
          start_screenshot_url: startUrl,
          end_screenshot_url: endUrl,
        },
      });
      if (error) throw error;

      await supabase.from("sessions").update({
        ocr_start_amount: data.start_amount,
        ocr_end_amount: data.end_amount,
        ocr_confidence: data.confidence,
      } as any).eq("id", sessionId);

      toast.success(`OCR complete — Confidence: ${data.confidence}%`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "OCR analysis failed");
    }
    setAnalyzing(false);
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
          "🤖 Run AI Screenshot Analysis"
        )}
      </Button>
    </div>
  );
}
