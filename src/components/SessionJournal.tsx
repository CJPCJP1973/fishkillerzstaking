import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import { toast } from "sonner";

interface JournalEntry {
  id: string;
  session_id: string;
  user_id: string | null;
  author_name: string;
  message: string;
  entry_type: string;
  created_at: string;
}

export default function SessionJournal({ sessionId }: { sessionId: string }) {
  const { user, username } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from("session_journal" as any)
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setEntries(data as unknown as JournalEntry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();

    // Realtime subscription
    const channel = supabase
      .channel(`journal-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_journal",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setEntries((prev) => [...prev, payload.new as unknown as JournalEntry]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const handlePost = async () => {
    if (!note.trim() || !user) return;

    setPosting(true);
    const { error } = await supabase.from("session_journal" as any).insert({
      session_id: sessionId,
      user_id: user.id,
      author_name: username || user.email?.split("@")[0] || "User",
      message: note.trim(),
      entry_type: "note",
    } as any);

    if (error) {
      toast.error("Could not post note. You may not have access to this session.");
    } else {
      setNote("");
    }
    setPosting(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="border border-border rounded-lg bg-card/50 mt-3">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="font-display font-bold text-sm text-foreground">Session Journal</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{entries.length} entries</span>
      </div>

      <ScrollArea className="max-h-48 px-3 py-2">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No journal entries yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div
                key={e.id}
                className={`flex items-start gap-2 text-xs ${
                  e.entry_type === "system" ? "opacity-70" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {e.entry_type === "system" ? (
                    <Bot className="h-3.5 w-3.5 text-accent" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`font-display font-bold ${
                        e.entry_type === "system" ? "text-accent" : "text-primary"
                      }`}
                    >
                      {e.author_name}
                    </span>
                    <span className="text-muted-foreground text-[10px]">{formatTime(e.created_at)}</span>
                  </div>
                  <p className="text-foreground break-words">{e.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {user && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Post a note…"
            className="h-8 text-xs bg-secondary border-border"
            maxLength={500}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePost()}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-primary hover:text-primary/80"
            onClick={handlePost}
            disabled={posting || !note.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
