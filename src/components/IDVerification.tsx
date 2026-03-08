import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, Clock, XCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

interface IDVerificationProps {
  verificationStatus: string;
  verificationNote?: string | null;
}

export default function IDVerification({ verificationStatus, verificationNote }: IDVerificationProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/government-id.${ext}`;

      // Remove old file if exists
      await supabase.storage.from("user-ids").remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from("user-ids")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Update profile verification status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ verification_status: "pending_verification" } as any)
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      toast.success("ID uploaded! Your verification is now pending review.");
      setOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
  };

  if (verificationStatus === "verified") {
    return (
      <div className="flex items-center gap-2 text-xs text-success">
        <ShieldCheck className="h-4 w-4" />
        <span className="font-medium">Identity Verified</span>
      </div>
    );
  }

  if (verificationStatus === "pending_verification") {
    return (
      <div className="flex items-center gap-2 text-xs text-accent">
        <Clock className="h-4 w-4" />
        <span className="font-medium">ID Verification Pending</span>
      </div>
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-destructive">
          <XCircle className="h-4 w-4" />
          <span className="font-medium">ID Rejected</span>
        </div>
        {verificationNote && (
          <p className="text-[10px] text-muted-foreground bg-destructive/10 rounded px-2 py-1">
            Reason: {verificationNote}
          </p>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-xs">
              <Upload className="h-3 w-3 mr-1" /> Re-upload ID
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Re-upload Government ID</DialogTitle>
              <DialogDescription>
                Your previous submission was rejected. Please upload a clearer image.
              </DialogDescription>
            </DialogHeader>
            <label className="flex flex-col items-center gap-3 border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload your ID</span>
              <span className="text-[10px] text-muted-foreground">JPG, PNG — Max 10MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            {uploading && <p className="text-xs text-center text-muted-foreground">Uploading...</p>}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default: none — show upload CTA
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs border-accent/30 text-accent hover:bg-accent/10">
          <ShieldCheck className="h-3 w-3 mr-1" /> Verify Identity
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Identity Verification</DialogTitle>
          <DialogDescription>
            Upload a photo of your government-issued ID (driver's license, passport, etc.) to verify your identity.
          </DialogDescription>
        </DialogHeader>
        <label className="flex flex-col items-center gap-3 border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Click to upload your ID</span>
          <span className="text-[10px] text-muted-foreground">JPG, PNG — Max 10MB</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        {uploading && <p className="text-xs text-center text-muted-foreground">Uploading...</p>}
        <p className="text-[9px] text-muted-foreground/60 text-center italic">
          Your ID is stored securely and only accessible by admins for verification.
        </p>
      </DialogContent>
    </Dialog>
  );
}
