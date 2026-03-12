import { ShieldAlert } from "lucide-react";

interface GeoBlockProps {
  region: string;
}

export default function GeoBlock({ region }: GeoBlockProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Access Restricted
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          FishKillerz is not available in <span className="font-semibold text-foreground">{region}</span> due
          to local regulations. We appreciate your interest, but we are unable
          to offer our services in your state at this time.
        </p>
        <p className="text-xs text-muted-foreground/70">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
