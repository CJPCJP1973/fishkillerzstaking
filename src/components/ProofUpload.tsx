import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { computeFileHash } from "@/lib/fileHash";

interface Props {
  sessionId: string;
  type: "deposit" | "payout";
  currentUrl: string | null;
  onUploaded: () => void;
}

export default function ProofUpload({ sessionId, type, currentUrl, onUploaded }: Props) {
  const { user, username } = useAuth();
  const [uploading, setUploading] = useState(false);

  const label = type === "deposit" ? "Deposit Proof" : "Payout Proof";
  const requirements =
    type === "deposit"
      ? ["Transaction/Payment ID", "Payment Status", "Timestamp"]
      : ["Final Withdrawn Amount", "Payout Confirmation"];

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      // Hash check — prevent recycled screenshots
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

      const ext = file.name.split(".").pop();
      const path = `${sessionId}/${type}-proof-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("session-screenshots")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const col = type === "deposit" ? "deposit_proof_url" : "payout_proof_url";
      const { error: updateErr } = await supabase
        .from("sessions")
        .update({ [col]: path } as any)
        .eq("id", sessionId);
      if (updateErr) throw updateErr;

      // Record hash to prevent reuse
      await supabase.from("screenshot_hashes" as any).insert({
        file_hash: hash,
        session_id: sessionId,
        upload_type: `${type}_proof`,
        uploaded_by: user.id,
      } as any);

      // Log to session journal
      await supabase.from("session_journal" as any).insert({
        session_id: sessionId,
        user_id: user.id,
        author_name: username || user.email?.split("@")[0] || "User",
        message: `${label} uploaded: ${file.name}`,
        entry_type: "system",
      } as any);

      toast.success(`${label} uploaded successfully`);
      onUploaded();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
  };

  return (
    <div className="bg-secondary/50 border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-display font-bold text-foreground flex items-center gap-1.5">
          {currentUrl ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-accent" />
          )}
          {label}
        </p>
        {currentUrl ? (
          <span className="text-[10px] text-success font-display font-bold">✓ Uploaded</span>
        ) : (
          <span className="text-[10px] text-destructive font-display font-bold">Required</span>
        )}
      </div>

      <div className="text-[10px] text-muted-foreground space-y-0.5">
        <p className="font-medium">Must show:</p>
        {requirements.map((r) => (
          <p key={r} className="pl-2">• {r}</p>
        ))}
      </div>

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
            {currentUrl ? "Replace Screenshot" : `Upload ${label}`}
          </span>
        </Button>
      </label>
    </div>
  );
}
