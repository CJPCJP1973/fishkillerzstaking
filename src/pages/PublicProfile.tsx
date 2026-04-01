import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, TrendingUp, Target, ShieldAlert, ShieldCheck } from "lucide-react";

interface PublicProfileData {
  display_name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  seller_status: string | null;
  total_wins: number | null;
  total_staked: number | null;
  win_rate: number | null;
  verified: boolean | null;
  
  is_vip: boolean;
  completed_sessions: number;
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase.rpc("get_public_profile", {
        _username: username,
      });

      if (error || !data || (data as any[]).length === 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const profileData = (data as any[])[0];

      // Get VIP and session info from leaderboard
      const { data: leaderboard } = await supabase.rpc("get_seller_leaderboard");
      const lbEntry = (leaderboard as any[])?.find((e: any) => e.username === username);

      setProfile({
        ...profileData,
        is_vip: lbEntry?.is_vip ?? false,
        completed_sessions: lbEntry?.completed_sessions ?? 0,
      } as PublicProfileData);
      setLoading(false);
    };
    fetchProfile();
  }, [username]);

  return (
    <Layout>
      <div className="container max-w-lg py-8 pb-24 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : notFound ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              User not found.
            </CardContent>
          </Card>
        ) : profile ? (
          <>
            {/* Header */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display text-2xl font-bold text-foreground truncate">
                        {profile.display_name}
                      </h1>
                      {profile.is_vip && <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30 text-[10px]">👑 VIP</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                    {profile.bio && (
                      <p className="text-sm text-foreground/80 mt-1">{profile.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy className="h-4 w-4 text-primary mx-auto mb-1" />
                  <div className="font-display font-bold text-lg text-foreground">
                    {profile.total_wins ?? 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Wins</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
                  <div className="font-display font-bold text-lg text-foreground">
                    {profile.win_rate != null ? `${Number(profile.win_rate).toFixed(0)}%` : "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="h-4 w-4 text-primary mx-auto mb-1" />
                  <div className="font-display font-bold text-lg text-foreground">
                    {profile.completed_sessions}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Sessions</div>
                </CardContent>
              </Card>
              <Card className={profile.verified ? "border-success/40" : "border-border"}>
                <CardContent className="p-4 text-center">
                  {profile.verified ? (
                    <ShieldCheck className="h-4 w-4 text-success mx-auto mb-1" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  )}
                  <div className={`font-display font-bold text-lg ${profile.verified ? "text-success" : "text-muted-foreground"}`}>
                    {profile.verified ? "Verified" : "Unverified"}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Trust</div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
