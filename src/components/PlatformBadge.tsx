const platformColors: Record<string, string> = {
  "Golden Dragon": "bg-accent/20 text-accent border-accent/30",
  "Diamond Dragon": "bg-primary/20 text-primary border-primary/30",
  "Fire Phoenix": "bg-destructive/20 text-destructive border-destructive/30",
  "Vblink": "bg-primary/20 text-primary border-primary/30",
  "Riversweeps": "bg-success/20 text-success border-success/30",
  "Magic City": "bg-accent/20 text-accent border-accent/30",
};

export default function PlatformBadge({ platform }: { platform: string }) {
  const style = platformColors[platform] || "bg-secondary text-secondary-foreground border-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {platform}
    </span>
  );
}
