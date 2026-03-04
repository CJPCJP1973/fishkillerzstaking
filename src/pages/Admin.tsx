import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Shield, CheckCircle, AlertTriangle, DollarSign, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SellerRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles?: { display_name: string; email: string; username: string } | null;
}

export default function Admin() {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("seller_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (!data) return;

    // Fetch profile info for each request
    const userIds = data.map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, username")
      .in("user_id", userIds);

    const enriched = data.map((r: any) => ({
      ...r,
      profiles: profiles?.find((p) => p.user_id === r.user_id) || null,
    }));
    setRequests(enriched);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (request: SellerRequest, action: "approved" | "rejected") => {
    setLoadingId(request.id);
    try {
      const { error: reqErr } = await supabase
        .from("seller_requests")
        .update({ status: action, reviewed_at: new Date().toISOString() } as any)
        .eq("id", request.id);
      if (reqErr) throw reqErr;

      if (action === "approved") {
        const { error: profErr } = await supabase
          .from("profiles")
          .update({ seller_status: "active" } as any)
          .eq("user_id", request.user_id);
        if (profErr) throw profErr;

        const { error: roleErr } = await supabase
          .from("user_roles")
          .insert({ user_id: request.user_id, role: "seller" } as any);
        if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;
      } else {
        await supabase
          .from("profiles")
          .update({ seller_status: "none" } as any)
          .eq("user_id", request.user_id);
      }

      toast.success(`Seller request ${action}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
    setLoadingId(null);
  };

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-accent" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manage sellers, escrow & sessions</p>
          </div>
        </div>

        <Tabs defaultValue="sellers" className="w-full">
          <TabsList className="bg-secondary">
            <TabsTrigger value="sellers" className="font-display">Pending Sellers</TabsTrigger>
            <TabsTrigger value="escrow" className="font-display">Escrow</TabsTrigger>
          </TabsList>

          <TabsContent value="sellers" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">
              Pending Seller Requests ({requests.length})
            </h2>
            {requests.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No pending requests.</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="gradient-card rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-accent/20">
                      <UserCheck className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {req.profiles?.display_name || "Unknown"}
                        {req.profiles?.username && (
                          <span className="text-primary ml-1">@{req.profiles.username}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.profiles?.email} • {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === req.id}
                      onClick={() => handleAction(req, "rejected")}
                      className="text-destructive border-destructive/30 text-xs"
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={loadingId === req.id}
                      onClick={() => handleAction(req, "approved")}
                      className="gradient-primary text-primary-foreground font-display font-bold text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="escrow" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Pending Escrow Actions</h2>
            <div className="gradient-card rounded-lg p-6 text-center">
              <p className="text-muted-foreground text-sm">No pending escrow actions.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
