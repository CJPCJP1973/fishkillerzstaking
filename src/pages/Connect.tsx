import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";

const mcpUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mcp`;

export default function Connect() {
  const [copied, setCopied] = useState(false);
  useSEO({
    title: "Connect an AI assistant | FishKillerz",
    description: "Connect ChatGPT or Claude to FishKillerz to browse sessions, slot pools, and the leaderboard.",
    canonical: "/connect",
  });

  const copy = async () => {
    await navigator.clipboard.writeText(mcpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Layout>
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Connect an AI assistant</h1>
          <p className="text-muted-foreground">
            Add FishKillerz to ChatGPT or Claude so you can ask them about live sessions,
            slot pools, and the leaderboard. Copy the URL below, then follow the steps for
            your assistant.
          </p>
        </header>

        <Card className="p-4 sm:p-5 space-y-3 border-primary/40">
          <div className="text-sm text-muted-foreground">Your MCP server URL</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm font-mono">
              {mcpUrl}
            </code>
            <Button onClick={copy} size="sm" variant="secondary" aria-label="Copy MCP URL">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">ChatGPT</h2>
          <Card className="p-5">
            <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed">
              <li>
                Open{" "}
                <a
                  href="https://chatgpt.com/#settings/Connectors/Advanced"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline inline-flex items-center gap-1"
                >
                  ChatGPT Connectors settings <ExternalLink className="h-3 w-3" />
                </a>{" "}
                and enable Developer mode (read the risk notice shown there).
              </li>
              <li>In the chat composer's "+" menu, turn on Developer mode.</li>
              <li>Click <strong>Add sources</strong>, then <strong>Connect more</strong>.</li>
              <li>Name the connector (e.g. "FishKillerz") and paste the MCP URL above.</li>
              <li>Start a chat and ask ChatGPT to use FishKillerz.</li>
            </ol>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Claude</h2>
          <Card className="p-5">
            <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed">
              <li>
                Open{" "}
                <a
                  href="https://claude.ai/customize/connectors?modal=add-custom-connector"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline inline-flex items-center gap-1"
                >
                  Claude custom connectors <ExternalLink className="h-3 w-3" />
                </a>
                .
              </li>
              <li>Name the connector (e.g. "FishKillerz") and paste the MCP URL above.</li>
              <li>
                Enable the connector from the chat composer, then ask Claude to use
                FishKillerz.
              </li>
            </ol>
          </Card>
        </section>

        <p className="text-sm text-muted-foreground">
          Once connected, your assistant can list active staking sessions, get full details
          for a session, browse slot pools, and pull the shooter leaderboard.
        </p>
      </main>
    </Layout>
  );
}
