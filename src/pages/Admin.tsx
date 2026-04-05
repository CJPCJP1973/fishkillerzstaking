import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Shield, CheckCircle, DollarSign, UserCheck, XCircle, Trash2, Crosshair, Banknote, Send, Eye, Zap, Users, Ban, Settings, AlertTriangle, Plus, UserCog, Wallet, ShieldCheck, Image, TrendingUp, Scale, ScrollText } from "lucide-react";
import ScreenshotComparison from "@/components/admin/ScreenshotComparison";
import ProofUpload from "@/components/ProofUpload";
import DisputeReview from "@/components/admin/DisputeReview";
import TransactionLogs from "@/components/admin/TransactionLogs";
import OcrDashboardWidget from "@/components/OcrDashboardWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SellerRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles?: { display_name: string; username: string } | null;
}

interface PendingStake {
  id: string;
  amount: number;
  payment_method: string | null;
  created_at: string;
  session_id: string;
  backer_id: string;
  backer_profile?: { display_name: string; username: string } | null;
  session_info?: { shooter_name: string; platform: string } | null;
}

interface SessionRow {
  id: string;
  shooter_id: string;
  shooter_name: string;
  platform: string;
  total_buy_in: number;
  stake_available: number;
  stake_sold: number;
  status: string;
  end_time: string;
  created_at: string;
  winnings: number | null;
  platform_fee: number | null;
  start_screenshot_url: string | null;
  end_screenshot_url: string | null;
  ocr_start_amount: number | null;
  ocr_end_amount: number | null;
  ocr_confidence: number | null;
  manual_rake_status: string | null;
  deposit_proof_url: string | null;
  payout_proof_url: string | null;
}

interface PayoutRow {
  id: string;
  session_id: string;
  stake_id: string;
  backer_id: string;
  backer_name: string | null;
  backer_cashtag: string | null;
  amount_owed: number;
  status: string;
  transaction_reference: string | null;
  session_info?: { shooter_name: string; platform: string } | null;
  payment_info?: { cashapp_tag: string | null; chime_handle: string | null; btc_address: string | null; btc_lightning: string | null } | null;
}

interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  payment_method: string | null;
  created_at: string;
  user_profile?: { display_name: string; username: string } | null;
}

interface UserRow {
  user_id: string;
  display_name: string;
  username: string;
  email: string | null;
  seller_status: string;
  verified: boolean | null;
  created_at: string | null;
  roles: string[];
  fraud_flags: number;
  is_shadow_banned: boolean;
}

interface ConfirmedAgent {
  id: string;
  agent_name: string;
  notes: string | null;
  created_at: string | null;
}

interface ConfirmedSeller {
  user_id: string;
  display_name: string;
  username: string;
  email: string | null;
  seller_status: string;
  verified: boolean | null;
}

interface PendingVerification {
  user_id: string;
  display_name: string;
  username: string;
  email: string | null;
  verification_status: string;
  verification_note: string | null;
}

export default function Admin() {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [stakes, setStakes] = useState<PendingStake[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [confirmedSellers, setConfirmedSellers] = useState<ConfirmedSeller[]>([]);
  const [agents, setAgents] = useState<ConfirmedAgent[]>([]);
  const [walletTxns, setWalletTxns] = useState<WalletTransaction[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [verificationNotes, setVerificationNotes] = useState<Record<string, string>>({});
  const [verificationImages, setVerificationImages] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [settleSessionId, setSettleSessionId] = useState<string | null>(null);
  const [screenshotSessionId, setScreenshotSessionId] = useState<string | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState("");
  // God Mode state
  const [manualPayoutSessionId, setManualPayoutSessionId] = useState("");
  const [manualPayoutUserId, setManualPayoutUserId] = useState("");
  const [manualPayoutAmount, setManualPayoutAmount] = useState("");
  const [overrideSessionId, setOverrideSessionId] = useState("");
  const [overrideStatus, setOverrideStatus] = useState("");
  // Agent form state
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentNotes, setNewAgentNotes] = useState("");
  // Platform stats
  const [platformStats, setPlatformStats] = useState({
    totalEscrow: 0,
    totalPaidOut: 0,
    totalListingFees: 0,
    totalRegFees: 0,
  });
  const [payoutRefs, setPayoutRefs] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("seller_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (!data) return;

    const userIds = data.map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username")
      .in("user_id", userIds);

    setRequests(data.map((r: any) => ({
      ...r,
      profiles: profiles?.find((p) => p.user_id === r.user_id) || null,
    })));
  };

  const fetchPendingStakes = async () => {
    const { data } = await supabase
      .from("stakes")
      .select("*")
      .eq("deposit_confirmed", false)
      .order("created_at", { ascending: true });
    if (!data) return;

    const backerIds = [...new Set(data.map((s: any) => s.backer_id))];
    const sessionIds = [...new Set(data.map((s: any) => s.session_id))];

    const [{ data: profiles }, { data: sessionsData }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, username").in("user_id", backerIds),
      supabase.from("sessions").select("id, shooter_name, platform").in("id", sessionIds),
    ]);

    setStakes(data.map((s: any) => ({
      ...s,
      backer_profile: profiles?.find((p) => p.user_id === s.backer_id) || null,
      session_info: sessionsData?.find((sess) => sess.id === s.session_id) || null,
    })));
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSessions(data as any);
  };

  const fetchPayouts = async () => {
    const { data } = await supabase
      .from("payouts")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (!data) return;

    const sessionIds = [...new Set(data.map((p: any) => p.session_id))];
    const backerIds = [...new Set(data.map((p: any) => p.backer_id))];
    const [{ data: sessionsData }, { data: paymentProfiles }] = await Promise.all([
      supabase.from("sessions").select("id, shooter_name, platform").in("id", sessionIds),
      supabase.from("payment_profiles").select("user_id, cashapp_tag, chime_handle, btc_address, btc_lightning").in("user_id", backerIds),
    ]);

    setPayouts(data.map((p: any) => ({
      ...p,
      session_info: sessionsData?.find((s) => s.id === p.session_id) || null,
      payment_info: paymentProfiles?.find((pp) => pp.user_id === p.backer_id) || null,
    })));
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, seller_status, verified, created_at, fraud_flags, is_shadow_banned")
      .order("created_at", { ascending: false });

    if (!profiles) return;

    const userIds = (profiles as any[]).map((p: any) => p.user_id);
    const [{ data: roles }, { data: emails }] = await Promise.all([
      supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
      supabase.rpc("admin_get_user_emails", { _user_ids: userIds }),
    ]);

    setUsers((profiles as any[]).map((p: any) => ({
      ...p,
      email: (emails as any[])?.find((e: any) => e.user_id === p.user_id)?.email || null,
      fraud_flags: p.fraud_flags ?? 0,
      is_shadow_banned: p.is_shadow_banned ?? false,
      roles: roles?.filter((r) => r.user_id === p.user_id).map((r) => r.role) || [],
    })));
  };

  const fetchConfirmedSellers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, seller_status, verified")
      .eq("seller_status", "active")
      .order("display_name", { ascending: true });
    if (!data) return;
    const sellerIds = (data as any[]).map((s: any) => s.user_id);
    const { data: emails } = await supabase.rpc("admin_get_user_emails", { _user_ids: sellerIds });
    setConfirmedSellers((data as any[]).map((s: any) => ({
      ...s,
      email: (emails as any[])?.find((e: any) => e.user_id === s.user_id)?.email || null,
    })));
  };

  const fetchAgents = async () => {
    const { data } = await supabase
      .from("confirmed_agents")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAgents(data as any);
  };

  const fetchWalletTxns = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (!data) return;

    const userIds = [...new Set((data as any[]).map((t: any) => t.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username")
      .in("user_id", userIds);

    setWalletTxns((data as any[]).map((t: any) => ({
      ...t,
      user_profile: profiles?.find((p) => p.user_id === t.user_id) || null,
    })));
  };

  const fetchPendingVerifications = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, verification_status, verification_note")
      .eq("verification_status", "pending_verification")
      .order("created_at", { ascending: true });
    if (!data) return;
    const pvIds = (data as any[]).map((p: any) => p.user_id);
    const { data: emails } = await supabase.rpc("admin_get_user_emails", { _user_ids: pvIds });
    const enriched = (data as any[]).map((p: any) => ({
      ...p,
      email: (emails as any[])?.find((e: any) => e.user_id === p.user_id)?.email || null,
    }));
    setPendingVerifications(enriched as any);

    // Fetch signed URLs for each user's ID image
    const imageMap: Record<string, string> = {};
    for (const profile of data) {
      const { data: files } = await supabase.storage
        .from("user-ids")
        .list(profile.user_id, { limit: 1 });
      if (files && files.length > 0) {
        const { data: signedData } = await supabase.storage
          .from("user-ids")
          .createSignedUrl(`${profile.user_id}/${files[0].name}`, 3600);
        if (signedData?.signedUrl) {
          imageMap[profile.user_id] = signedData.signedUrl;
        }
      }
    }
    setVerificationImages(imageMap);
  };

  const handleVerificationAction = async (profile: PendingVerification, action: "verified" | "rejected") => {
    if (loadingId) return;
    setLoadingId(profile.user_id);
    try {
      const updateData: any = { verification_status: action };
      if (action === "verified") {
        updateData.verified = true;
        updateData.verification_note = null;
      } else {
        updateData.verification_note = verificationNotes[profile.user_id]?.trim() || "ID rejected";
      }
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", profile.user_id);
      if (error) throw error;
      toast.success(`User ${action === "verified" ? "approved" : "rejected"}`);
      fetchPendingVerifications();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
    setLoadingId(null);
  };

  const fetchPlatformStats = async () => {
    const [{ data: allProfiles }, { data: paidPayouts }, { data: listingFeeTxns }, { data: regFeeTxns }] = await Promise.all([
      supabase.from("profiles").select("balance"),
      supabase.from("payouts").select("amount_owed").eq("status", "paid"),
      supabase.from("transactions").select("amount").eq("type", "listing_fee").eq("status", "completed"),
      supabase.from("transactions").select("amount").eq("type", "registration_fee").eq("status", "confirmed"),
    ]);

    setPlatformStats({
      totalEscrow: allProfiles?.reduce((sum, p) => sum + Number(p.balance || 0), 0) || 0,
      totalPaidOut: paidPayouts?.reduce((sum, p) => sum + Number(p.amount_owed || 0), 0) || 0,
      totalListingFees: listingFeeTxns?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0,
      totalRegFees: regFeeTxns?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0,
    });
  };

  useEffect(() => {
    fetchRequests();
    fetchPendingStakes();
    fetchSessions();
    fetchPayouts();
    fetchUsers();
    fetchConfirmedSellers();
    fetchAgents();
    fetchWalletTxns();
    fetchPendingVerifications();
    fetchPlatformStats();
  }, []);

  const handleSellerAction = async (request: SellerRequest, action: "approved" | "rejected") => {
    if (loadingId) return;
    setLoadingId(request.id);
    try {
      await supabase.from("seller_requests").update({ status: action, reviewed_at: new Date().toISOString() } as any).eq("id", request.id);
      if (action === "approved") {
        await supabase.from("profiles").update({ seller_status: "active" } as any).eq("user_id", request.user_id);
        const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: request.user_id, role: "seller" } as any);
        if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;
      } else {
        await supabase.from("profiles").update({ seller_status: "none" } as any).eq("user_id", request.user_id);
      }
      toast.success(`Seller request ${action}`);
      fetchRequests();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
    setLoadingId(null);
  };

  const handleStakeAction = async (stake: PendingStake, action: "confirm" | "reject") => {
    if (loadingId) return;
    setLoadingId(stake.id);
    try {
      if (action === "confirm") {
        await supabase.from("stakes").update({ deposit_confirmed: true } as any).eq("id", stake.id);
        const { data: sessionData } = await supabase.from("sessions").select("stake_sold").eq("id", stake.session_id).single();
        const newSold = (Number(sessionData?.stake_sold) || 0) + Number(stake.amount);
        await supabase.from("sessions").update({ stake_sold: newSold } as any).eq("id", stake.session_id);
        toast.success(`Stake of $${stake.amount} confirmed!`);
      } else {
        await supabase.from("stakes").delete().eq("id", stake.id);
        toast.success("Stake rejected and removed");
      }
      fetchPendingStakes();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
    setLoadingId(null);
  };

  const handleDeleteSession = async (session: SessionRow) => {
    if (loadingId) return;
    const confirmed = window.confirm(`Delete session "${session.shooter_name} — ${session.platform}"? This will also remove all associated stakes and payouts.`);
    if (!confirmed) return;
    setLoadingId(session.id);
    try {
      await supabase.from("payouts").delete().eq("session_id", session.id);
      await supabase.from("stakes").delete().eq("session_id", session.id);
      const { error } = await supabase.from("sessions").delete().eq("id", session.id);
      if (error) throw error;
      toast.success("Session deleted");
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete session");
    }
    setLoadingId(null);
  };

  const handleSettleSession = async (session: SessionRow) => {
    const cashOut = parseFloat(cashOutAmount);
    if (!cashOut || cashOut < 0) {
      toast.error("Enter a valid cash-out amount");
      return;
    }
    if (loadingId) return;
    setLoadingId(session.id);
    try {
      const { data: confirmedStakes } = await supabase
        .from("stakes")
        .select("id, backer_id, amount, payment_mode, rake_rate")
        .eq("session_id", session.id)
        .eq("deposit_confirmed", true);

      if (!confirmedStakes || confirmedStakes.length === 0) {
        toast.error("No confirmed stakes to settle");
        setLoadingId(null);
        return;
      }

      const totalStaked = confirmedStakes.reduce((sum, s) => sum + Number(s.amount), 0);

      // No rake — backers get their full pro-rata share
      const stakeDetails = (confirmedStakes as any[]).map((stake) => {
        const share = Number(stake.amount) / totalStaked;
        const stakeShareOfCashout = cashOut * share;
        return {
          ...stake,
          share,
          stakeShareOfCashout,
          stakeFee: 0,
          amountOwed: Math.round(stakeShareOfCashout * 100) / 100,
          paymentMode: stake.payment_mode || "p2p",
        };
      });

      const hasP2PStakes = stakeDetails.some((s) => s.paymentMode === "p2p");
      const hasFishdollarzStakes = stakeDetails.some((s) => s.paymentMode === "fishdollarz");

      const backerIds = confirmedStakes.map((s) => s.backer_id);
      const [{ data: profiles }, { data: paymentProfiles }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, username").in("user_id", backerIds),
        supabase.from("payment_profiles").select("user_id, cashapp_tag").in("user_id", backerIds),
      ]);

      const payoutInserts = stakeDetails.map((stake) => {
        const profile = profiles?.find((p) => p.user_id === stake.backer_id);
        const payment = paymentProfiles?.find((p) => p.user_id === stake.backer_id);
        return {
          session_id: session.id,
          stake_id: stake.id,
          backer_id: stake.backer_id,
          backer_name: profile?.display_name || "Unknown",
          backer_cashtag: payment?.cashapp_tag || null,
          amount_owed: stake.amountOwed,
          status: "pending",
        };
      });

      const { error: payoutError } = await supabase.from("payouts").insert(payoutInserts as any);
      if (payoutError) throw payoutError;

      // For FishDollarz stakes, auto-move winnings to backer balances & +1 reliability
      for (const stake of stakeDetails) {
        if (stake.paymentMode === "fishdollarz") {
          // Credit backer's balance with their winnings (minus rake)
          await supabase.rpc("adjust_balance", {
            target_uid: stake.backer_id,
            delta: stake.amountOwed,
          });
          // +1 reliability score
          const { data: prof } = await supabase
            .from("profiles")
            .select("reliability_score")
            .eq("user_id", stake.backer_id)
            .single();
          const currentScore = Number((prof as any)?.reliability_score ?? 75);
          const newScore = Math.min(100, currentScore + 1);
          await supabase
            .from("profiles")
            .update({ reliability_score: newScore } as any)
            .eq("user_id", stake.backer_id);
          // Notify backer
          await supabase.from("notifications").insert({
            user_id: stake.backer_id,
            title: "Winnings Credited ✅",
            message: `$${stake.amountOwed.toLocaleString()} has been added to your FishDollarz balance.`,
            type: "success",
          } as any);
          // Mark payout as paid automatically
          await supabase.from("payouts").update({ status: "paid" } as any)
            .eq("stake_id", stake.id)
            .eq("session_id", session.id);
          await supabase.from("stakes").update({
            winnings_amount: stake.amountOwed,
            winnings_released: true,
          } as any).eq("id", stake.id);
        }
      }

      await supabase.from("sessions").update({
        status: "completed",
        winnings: cashOut,
        platform_fee: 0,
      } as any).eq("id", session.id);

      toast.success(`Settled! ${payoutInserts.length} payouts created — no rake, $1 listing fee was pre-paid`);
      setSettleSessionId(null);
      setCashOutAmount("");
      fetchSessions();
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Failed to settle session");
    }
    setLoadingId(null);
  };

  // Handle confirming manual P2P rake received
  const handleConfirmManualRake = async (session: SessionRow) => {
    if (loadingId) return;
    setLoadingId(session.id);
    try {
      await supabase.from("sessions").update({
        manual_rake_status: "confirmed",
      } as any).eq("id", session.id);

      // +1 reliability for all P2P stakers (fee was paid on time)
      // No penalty since admin confirmed fee was received
      toast.success("Manual P2P rake confirmed!");
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm rake");
    }
    setLoadingId(null);
  };

  // Handle marking P2P rake as late (penalty)
  const handleLateManualRake = async (session: SessionRow) => {
    if (loadingId) return;
    const confirmed = window.confirm("Mark this P2P fee as LATE? This will deduct 5 reliability points from all P2P stakers on this session.");
    if (!confirmed) return;
    setLoadingId(session.id);
    try {
      // Get P2P stakes for this session
      const { data: p2pStakes } = await supabase
        .from("stakes")
        .select("backer_id")
        .eq("session_id", session.id)
        .eq("payment_mode", "p2p" as any)
        .eq("deposit_confirmed", true);

      if (p2pStakes) {
        for (const stake of p2pStakes) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("reliability_score")
            .eq("user_id", stake.backer_id)
            .single();
          const currentScore = Number((prof as any)?.reliability_score ?? 75);
          const newScore = Math.max(0, currentScore - 5);
          await supabase
            .from("profiles")
            .update({ reliability_score: newScore } as any)
            .eq("user_id", stake.backer_id);
          // Notify user
          await supabase.from("notifications").insert({
            user_id: stake.backer_id,
            title: "Reliability Score Decreased ⚠️",
            message: `Your reliability score dropped by 5 points to ${newScore}/100 due to late P2P fee payment.`,
            type: "warning",
          } as any);
        }
      }

      await supabase.from("sessions").update({
        manual_rake_status: "late_confirmed",
      } as any).eq("id", session.id);

      toast.success("P2P fee marked as late. Reliability scores adjusted.");
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
    setLoadingId(null);
  };

  const handleMarkPaid = async (payout: PayoutRow) => {
    if (loadingId) return;
    const ref = payoutRefs[payout.id]?.trim() || null;
    setLoadingId(payout.id);
    try {
      await supabase.from("payouts").update({ status: "paid", transaction_reference: ref } as any).eq("id", payout.id);
      await supabase.from("stakes").update({
        winnings_amount: payout.amount_owed,
        winnings_released: true,
      } as any).eq("id", payout.stake_id);
      toast.success(`Payout of $${payout.amount_owed} marked as paid`);
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark payout");
    }
    setLoadingId(null);
  };

  // Wallet: Approve deposit
  const handleApproveDeposit = async (tx: WalletTransaction) => {
    if (loadingId) return;
    setLoadingId(tx.id);
    try {
      // Update transaction status
      await supabase.from("transactions").update({ status: "confirmed" } as any).eq("id", tx.id);
      // Atomically add to user balance
      await supabase.rpc("adjust_balance", { target_uid: tx.user_id, delta: tx.amount });
      // Notify user
      await supabase.from("notifications").insert({
        user_id: tx.user_id,
        title: "Deposit Approved ✅",
        message: `Your $${tx.amount.toLocaleString()} deposit has been confirmed and added to your FishDollarz balance.`,
        type: "success",
      } as any);
      toast.success(`Deposit of $${tx.amount} approved for ${tx.user_profile?.display_name}`);
      fetchWalletTxns();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve deposit");
    }
    setLoadingId(null);
  };

  // Wallet: Approve withdrawal
  const handleApproveWithdrawal = async (tx: WalletTransaction) => {
    if (loadingId) return;
    setLoadingId(tx.id);
    try {
      // Atomically deduct from user balance
      await supabase.rpc("adjust_balance", { target_uid: tx.user_id, delta: -tx.amount });
      await supabase.from("transactions").update({ status: "settled" } as any).eq("id", tx.id);
      // Notify user
      await supabase.from("notifications").insert({
        user_id: tx.user_id,
        title: "Withdrawal Settled ✅",
        message: `Your $${tx.amount.toLocaleString()} withdrawal has been processed and settled.`,
        type: "success",
      } as any);
      toast.success(`Withdrawal of $${tx.amount} settled for ${tx.user_profile?.display_name}`);
      fetchWalletTxns();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve withdrawal");
    }
    setLoadingId(null);
  };

  // Wallet: Reject transaction
  const handleRejectTransaction = async (tx: WalletTransaction) => {
    if (loadingId) return;
    setLoadingId(tx.id);
    try {
      await supabase.from("transactions").update({ status: "rejected" } as any).eq("id", tx.id);
      // Notify user
      await supabase.from("notifications").insert({
        user_id: tx.user_id,
        title: "Transaction Rejected ❌",
        message: `Your $${tx.amount.toLocaleString()} ${tx.type} request was rejected. Contact support if you believe this is an error.`,
        type: "error",
      } as any);
      toast.success(`Transaction rejected`);
      fetchWalletTxns();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    }
    setLoadingId(null);
  };

  // God Mode: Toggle shadow ban
  const handleShadowBan = async (userRow: UserRow) => {
    if (loadingId) return;
    setLoadingId(userRow.user_id);
    try {
      const newVal = !userRow.is_shadow_banned;
      await supabase.from("profiles").update({ is_shadow_banned: newVal } as any).eq("user_id", userRow.user_id);
      toast.success(newVal ? "User has been neutralized." : "Shadow ban removed.");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
    setLoadingId(null);
  };

  // God Mode: Toggle user ban (remove/add seller role + set status)
  const handleBanUser = async (userRow: UserRow) => {
    if (loadingId) return;
    const isBanned = userRow.seller_status === "banned";
    const confirmed = window.confirm(
      isBanned
        ? `Unban user "${userRow.display_name}"?`
        : `Ban user "${userRow.display_name}"? They will lose seller access and cannot participate.`
    );
    if (!confirmed) return;
    setLoadingId(userRow.user_id);
    try {
      if (isBanned) {
        await supabase.from("profiles").update({ seller_status: "none" } as any).eq("user_id", userRow.user_id);
        toast.success(`${userRow.display_name} unbanned`);
      } else {
        await supabase.from("profiles").update({ seller_status: "banned" } as any).eq("user_id", userRow.user_id);
        // Remove seller role if they have it
        await supabase.from("user_roles").delete().eq("user_id", userRow.user_id).eq("role", "seller" as any);
        toast.success(`${userRow.display_name} banned`);
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
    setLoadingId(null);
  };

  // Remove user entirely (profile, roles, payment profile, related data)
  const handleRemoveUser = async (userRow: UserRow) => {
    if (loadingId) return;
    const confirmed = window.confirm(
      `⚠️ PERMANENTLY REMOVE user "${userRow.display_name}" (@${userRow.username})?\n\nThis will delete their profile, roles, payment info, and all associated data. This action cannot be undone.`
    );
    if (!confirmed) return;
    setLoadingId(userRow.user_id);
    try {
      // Delete in order: payouts → stakes → session_journal → sessions → transactions → notifications → seller_requests → payment_profiles → user_roles → profile
      await supabase.from("payouts").delete().eq("backer_id", userRow.user_id);
      await supabase.from("stakes").delete().eq("backer_id", userRow.user_id);
      await supabase.from("session_journal").delete().eq("user_id", userRow.user_id);
      // Delete sessions they created (and cascading data)
      const { data: userSessions } = await supabase.from("sessions").select("id").eq("shooter_id", userRow.user_id);
      if (userSessions && userSessions.length > 0) {
        const sessionIds = userSessions.map(s => s.id);
        await supabase.from("payouts").delete().in("session_id", sessionIds);
        await supabase.from("stakes").delete().in("session_id", sessionIds);
        await supabase.from("session_journal").delete().in("session_id", sessionIds);
        await supabase.from("sessions").delete().eq("shooter_id", userRow.user_id);
      }
      await supabase.from("transactions").delete().eq("user_id", userRow.user_id);
      await supabase.from("notifications").delete().eq("user_id", userRow.user_id);
      await supabase.from("seller_requests").delete().eq("user_id", userRow.user_id);
      await supabase.from("payment_profiles").delete().eq("user_id", userRow.user_id);
      await supabase.from("user_roles").delete().eq("user_id", userRow.user_id);
      await supabase.from("profiles").delete().eq("user_id", userRow.user_id);
      toast.success(`User "${userRow.display_name}" removed`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove user");
    }
    setLoadingId(null);
  };

  // God Mode: Toggle verified
  const handleToggleVerified = async (userRow: UserRow) => {
    if (loadingId) return;
    setLoadingId(userRow.user_id);
    try {
      await supabase.from("profiles").update({ verified: !userRow.verified } as any).eq("user_id", userRow.user_id);
      toast.success(`${userRow.display_name} ${userRow.verified ? "unverified" : "verified"}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
    setLoadingId(null);
  };

  // God Mode: Manual Payout Override
  const handleManualPayout = async () => {
    const amount = parseFloat(manualPayoutAmount);
    if (!manualPayoutSessionId || !manualPayoutUserId || !amount || amount <= 0) {
      toast.error("Fill in all manual payout fields");
      return;
    }
    setLoadingId("manual-payout");
    try {
      // Get or create a dummy stake reference
      const { data: existingStakes } = await supabase
        .from("stakes")
        .select("id")
        .eq("session_id", manualPayoutSessionId)
        .eq("backer_id", manualPayoutUserId)
        .limit(1);

      let stakeId = existingStakes?.[0]?.id;
      if (!stakeId) {
        // Create a manual stake record
        const { data: newStake, error: stakeErr } = await supabase.from("stakes").insert({
          session_id: manualPayoutSessionId,
          backer_id: manualPayoutUserId,
          amount: amount,
          deposit_confirmed: true,
          payment_method: "MANUAL_OVERRIDE",
        } as any).select("id").single();
        if (stakeErr) throw stakeErr;
        stakeId = newStake?.id;
      }

      const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", manualPayoutUserId).single();
      const { data: payment } = await supabase.from("payment_profiles").select("cashapp_tag").eq("user_id", manualPayoutUserId).single();

      const { error } = await supabase.from("payouts").insert({
        session_id: manualPayoutSessionId,
        stake_id: stakeId,
        backer_id: manualPayoutUserId,
        backer_name: profile?.display_name || "Manual Override",
        backer_cashtag: payment?.cashapp_tag || null,
        amount_owed: amount,
        status: "pending",
      } as any);
      if (error) throw error;

      toast.success(`Manual payout of $${amount} created`);
      setManualPayoutSessionId("");
      setManualPayoutUserId("");
      setManualPayoutAmount("");
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Manual payout failed");
    }
    setLoadingId(null);
  };

  // God Mode: Session Status Override
  const handleStatusOverride = async () => {
    if (!overrideSessionId || !overrideStatus) {
      toast.error("Select a session and status");
      return;
    }
    setLoadingId("status-override");
    try {
      const { error } = await supabase.from("sessions").update({ status: overrideStatus } as any).eq("id", overrideSessionId);
      if (error) throw error;
      toast.success(`Session status overridden to "${overrideStatus}"`);
      setOverrideSessionId("");
      setOverrideStatus("");
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Status override failed");
    }
    setLoadingId(null);
  };

  // Agent management
  const handleAddAgent = async () => {
    if (!newAgentName.trim()) {
      toast.error("Agent name is required");
      return;
    }
    setLoadingId("add-agent");
    try {
      const { error } = await supabase.from("confirmed_agents").insert({
        agent_name: newAgentName.trim(),
        notes: newAgentNotes.trim() || null,
      } as any);
      if (error) throw error;
      toast.success(`Agent "${newAgentName}" added`);
      setNewAgentName("");
      setNewAgentNotes("");
      fetchAgents();
    } catch (err: any) {
      toast.error(err.message || "Failed to add agent");
    }
    setLoadingId(null);
  };

  const handleDeleteAgent = async (agent: ConfirmedAgent) => {
    if (loadingId) return;
    const confirmed = window.confirm(`Remove agent "${agent.agent_name}"?`);
    if (!confirmed) return;
    setLoadingId(agent.id);
    try {
      const { error } = await supabase.from("confirmed_agents").delete().eq("id", agent.id);
      if (error) throw error;
      toast.success(`Agent "${agent.agent_name}" removed`);
      fetchAgents();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove agent");
    }
    setLoadingId(null);
  };

  const statusColor: Record<string, string> = {
    live: "bg-live/20 text-live border-live/30",
    funding: "bg-primary/20 text-primary border-primary/30",
    completed: "bg-success/20 text-success border-success/30",
    pending: "bg-accent/20 text-accent border-accent/30",
    cancelled: "bg-destructive/20 text-destructive border-destructive/30",
    disputed: "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-accent" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manage users, escrow, sessions & payouts</p>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "FishDollarz in Escrow", value: `$${platformStats.totalEscrow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wallet, color: "text-primary" },
            { label: "Total Paid Out", value: `$${platformStats.totalPaidOut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Send, color: "text-success" },
            { label: "Listing Fees", value: `$${platformStats.totalListingFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-accent" },
            { label: "Registration Fees", value: `$${platformStats.totalRegFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Users, color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="gradient-card rounded-lg p-3 flex items-center gap-3">
              <div className={`p-2 rounded-md bg-secondary ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* God Mode - Top of Page */}
        <Tabs defaultValue="escrow" className="w-full">
          <div className="space-y-3">
            {/* God Mode prominent button at top */}
            <TabsList className="bg-destructive/10 border border-destructive/20 w-full h-14 p-1">
              <TabsTrigger
                value="godmode"
                className="w-full h-full font-display text-base font-bold text-accent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-2"
              >
                <Zap className="h-5 w-5" /> GOD MODE
                <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px] ml-1">
                  <AlertTriangle className="h-3 w-3" />
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Main navigation tabs - organized grid */}
            <TabsList className="bg-secondary grid grid-cols-3 md:grid-cols-5 gap-1 h-auto p-2">
              <TabsTrigger value="escrow" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>Stakes <span className="text-primary">({stakes.length})</span></span>
              </TabsTrigger>
              <TabsTrigger value="payouts" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1">
                <Send className="h-4 w-4" />
                <span>Payouts <span className="text-primary">({payouts.length})</span></span>
              </TabsTrigger>
              <TabsTrigger value="sellers" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1">
                <UserCheck className="h-4 w-4" />
                <span>Sellers <span className="text-primary">({requests.length})</span></span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1">
                <Crosshair className="h-4 w-4" />
                <span>Sessions <span className="text-primary">({sessions.length})</span></span>
              </TabsTrigger>
              <TabsTrigger value="users" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Users <span className="text-primary">({users.length})</span></span>
              </TabsTrigger>
            </TabsList>
            <TabsList className="bg-secondary grid grid-cols-3 md:grid-cols-7 gap-1 h-auto p-2">
              <TabsTrigger value="confirmed-sellers" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>Confirmed <span className="text-primary">({confirmedSellers.length})</span></span>
              </TabsTrigger>
              <TabsTrigger value="agents" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1">
                <UserCog className="h-4 w-4" />
                <span>Agents <span className="text-primary">({agents.length})</span></span>
              </TabsTrigger>
              <TabsTrigger value="wallet-ledger" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1">
                <Wallet className="h-4 w-4" />
                <span>Wallet <span className="text-primary">({walletTxns.length})</span></span>
              </TabsTrigger>
              <TabsTrigger value="id-verification" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                <span>ID Verify <span className="text-primary">({pendingVerifications.length})</span></span>
              </TabsTrigger>
              <TabsTrigger value="ocr-monitor" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>OCR</span>
              </TabsTrigger>
              <TabsTrigger value="disputes" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1 text-destructive">
                <Scale className="h-4 w-4" />
                <span>Disputes</span>
              </TabsTrigger>
              <TabsTrigger value="txn-logs" className="font-display text-xs sm:text-sm py-3 flex flex-col items-center gap-1">
                <ScrollText className="h-4 w-4" />
                <span>Txn Logs</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Pending Stakes */}
          <TabsContent value="escrow" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Pending Stake Deposits</h2>
            {stakes.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No pending stakes to review.</p>
              </div>
            ) : (
              stakes.map((stake) => (
                <div key={stake.id} className="gradient-card rounded-lg p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-accent/20 shrink-0">
                      <DollarSign className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {stake.backer_profile?.display_name || "Unknown"}
                        {stake.backer_profile?.username && (
                          <span className="text-primary ml-1">@{stake.backer_profile.username}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        ${Number(stake.amount).toLocaleString()} → {stake.session_info?.shooter_name} ({stake.session_info?.platform})
                      </p>
                      <p className="text-xs text-accent font-medium truncate">
                        Ref: {stake.payment_method || "No ref provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === stake.id}
                      onClick={() => handleStakeAction(stake, "reject")}
                      className="text-destructive border-destructive/30 text-xs"
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={loadingId === stake.id}
                      onClick={() => handleStakeAction(stake, "confirm")}
                      className="gradient-primary text-primary-foreground font-display font-bold text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Confirm
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Payouts */}
          <TabsContent value="payouts" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Pending Payouts</h2>
            {payouts.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No pending payouts. Settle a session to generate them.</p>
              </div>
            ) : (
              payouts.map((payout) => (
                <div key={payout.id} className="gradient-card rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-md bg-success/20 shrink-0">
                        <Banknote className="h-4 w-4 text-success" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {payout.backer_name || "Unknown"}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {payout.payment_info?.cashapp_tag && (
                            <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">${payout.payment_info.cashapp_tag}</Badge>
                          )}
                          {payout.payment_info?.chime_handle && (
                            <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent border-accent/30">Chime: {payout.payment_info.chime_handle}</Badge>
                          )}
                          {payout.payment_info?.btc_address && (
                            <Badge variant="outline" className="text-[10px] bg-foreground/10 text-foreground border-foreground/20">BTC: {payout.payment_info.btc_address.slice(0, 10)}…</Badge>
                          )}
                          {payout.payment_info?.btc_lightning && (
                            <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent border-accent/30">⚡ {payout.payment_info.btc_lightning.slice(0, 12)}…</Badge>
                          )}
                          {!payout.payment_info?.cashapp_tag && !payout.payment_info?.chime_handle && !payout.payment_info?.btc_address && !payout.payment_info?.btc_lightning && (
                            <span className="text-[10px] text-destructive">No payment info on file</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Owes: <span className="text-accent font-display font-bold">${Number(payout.amount_owed).toLocaleString()}</span>
                          {" "}• {payout.session_info?.shooter_name} ({payout.session_info?.platform})
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={payoutRefs[payout.id] || ""}
                      onChange={(e) => setPayoutRefs((prev) => ({ ...prev, [payout.id]: e.target.value }))}
                      placeholder="Transaction ref (CashApp/Venmo #)"
                      className="bg-secondary border-border text-foreground text-xs flex-1"
                    />
                    <Button
                      size="sm"
                      disabled={loadingId === payout.id}
                      onClick={() => handleMarkPaid(payout)}
                      className="gradient-primary text-primary-foreground font-display font-bold text-xs shrink-0"
                    >
                      <Send className="h-3 w-3 mr-1" /> Mark Paid
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Sellers */}
          <TabsContent value="sellers" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Pending Seller Requests</h2>
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
                        {req.profiles?.username && <span className="text-primary ml-1">@{req.profiles.username}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={loadingId === req.id} onClick={() => handleSellerAction(req, "rejected")} className="text-destructive border-destructive/30 text-xs">
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button size="sm" disabled={loadingId === req.id} onClick={() => handleSellerAction(req, "approved")} className="gradient-primary text-primary-foreground font-display font-bold text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Sessions */}
          <TabsContent value="sessions" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">All Sessions</h2>
            {sessions.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No sessions yet.</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="gradient-card rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-md bg-primary/20 shrink-0">
                        <Crosshair className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {s.shooter_name} — {s.platform}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${Number(s.total_buy_in).toLocaleString()} buy-in • ${Number(s.stake_sold || 0).toLocaleString()} sold
                          {s.winnings != null && ` • $${Number(s.winnings).toLocaleString()} cash-out`}
                          {s.platform_fee != null && Number(s.platform_fee) > 0 && (
                            <span className="text-accent"> • ${Number(s.platform_fee).toLocaleString()} rake</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColor[s.status] || "bg-secondary text-muted-foreground"}>
                      {(s.status || "pending").toUpperCase()}
                    </Badge>
                  </div>

                  {/* Action Buttons - organized grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {s.status === "funding" && (
                      <Button
                        disabled={loadingId === s.id || !s.deposit_proof_url}
                        title={!s.deposit_proof_url ? "Deposit proof required" : "Start session"}
                        onClick={async () => {
                          if (!s.deposit_proof_url) {
                            await supabase.from("notifications").insert({
                              user_id: s.shooter_id,
                              title: "⚠️ Deposit Proof Missing",
                              message: `Your session "${s.shooter_name} — ${s.platform}" cannot be started. Please upload deposit proof documentation.`,
                              type: "warning",
                            } as any);
                            toast.error("Deposit proof missing — seller notified");
                            return;
                          }
                          setLoadingId(s.id);
                          try {
                            await supabase.from("sessions").update({ status: "live" } as any).eq("id", s.id);
                            toast.success("Session started (Live)");
                            fetchSessions();
                          } catch (err: any) { toast.error(err.message); }
                          setLoadingId(null);
                        }}
                        className="bg-live/20 text-live border border-live/30 hover:bg-live/30 font-display font-bold text-sm h-10"
                      >
                        <Crosshair className="h-4 w-4 mr-1.5" /> Start
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      disabled={loadingId === s.id}
                      onClick={() => setScreenshotSessionId(screenshotSessionId === s.id ? null : s.id)}
                      className="text-primary border-primary/30 hover:bg-primary/10 font-display font-bold text-sm h-10"
                    >
                      <Eye className="h-4 w-4 mr-1.5" /> Verify
                    </Button>
                    {s.status !== "completed" && (
                      <Button
                        disabled={loadingId === s.id || (s.status === "live" && !s.payout_proof_url)}
                        title={s.status === "live" && !s.payout_proof_url ? "Payout proof required" : "Settle"}
                        onClick={async () => {
                          if (s.status === "live" && !s.payout_proof_url) {
                            await supabase.from("notifications").insert({
                              user_id: s.shooter_id,
                              title: "⚠️ Payout Proof Missing",
                              message: `Your session "${s.shooter_name} — ${s.platform}" cannot be settled. Please upload payout proof documentation.`,
                              type: "warning",
                            } as any);
                            toast.error("Payout proof missing — seller notified");
                            return;
                          }
                          setSettleSessionId(settleSessionId === s.id ? null : s.id);
                          setCashOutAmount("");
                        }}
                        className="bg-success/20 text-success border border-success/30 hover:bg-success/30 font-display font-bold text-sm h-10"
                      >
                        <Banknote className="h-4 w-4 mr-1.5" /> Settle
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      disabled={loadingId === s.id}
                      onClick={() => handleDeleteSession(s)}
                      className="text-destructive border-destructive/30 hover:bg-destructive/10 font-display font-bold text-sm h-10"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                    </Button>
                  </div>

                  {/* Proof Uploads */}
                  <div className="grid grid-cols-2 gap-2">
                    <ProofUpload sessionId={s.id} type="deposit" currentUrl={s.deposit_proof_url} onUploaded={fetchSessions} />
                    <ProofUpload sessionId={s.id} type="payout" currentUrl={s.payout_proof_url} onUploaded={fetchSessions} />
                  </div>

                  {/* Screenshot Comparison */}
                  {screenshotSessionId === s.id && (
                    <ScreenshotComparison
                      sessionId={s.id}
                      startScreenshotUrl={s.start_screenshot_url}
                      endScreenshotUrl={s.end_screenshot_url}
                      ocrStartAmount={s.ocr_start_amount}
                      ocrEndAmount={s.ocr_end_amount}
                      ocrConfidence={s.ocr_confidence}
                      shooterId={s.shooter_id}
                      shooterName={s.shooter_name}
                      onUpdate={fetchSessions}
                      onBanned={() => { fetchSessions(); fetchUsers(); }}
                    />
                  )}

                  {/* Settle Form */}
                  {settleSessionId === s.id && (
                    <div className="bg-secondary rounded-md p-3 space-y-2">
                      <Label className="text-sm text-muted-foreground">Final Cash-Out Amount ($)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={cashOutAmount}
                          onChange={(e) => setCashOutAmount(e.target.value)}
                          placeholder="e.g. 1500"
                          className="bg-background border-border text-foreground"
                          min={0}
                        />
                        <Button
                          size="sm"
                          disabled={loadingId === s.id || !cashOutAmount}
                          onClick={() => handleSettleSession(s)}
                          className="gradient-primary text-primary-foreground font-display font-bold text-xs shrink-0"
                        >
                          {loadingId === s.id ? "Settling..." : "Confirm Settle"}
                        </Button>
                      </div>
                      {cashOutAmount && (
                        <div className="text-[10px] text-muted-foreground space-y-0.5">
                          <p>FishDollarz stakes: <span className="text-accent font-bold">6% rake</span> (auto-credited)</p>
                          <p>P2P stakes: <span className="text-primary font-bold">8% rake</span> (manual fee required)</p>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Rake rates vary by payment mode. FishDollarz winnings auto-credited to backer balances.
                      </p>
                    </div>
                  )}

                  {/* P2P Manual Rake Confirmation */}
                  {s.status === "completed" && s.manual_rake_status === "pending_manual_rake" && (
                    <div className="bg-accent/10 border border-accent/30 rounded-md p-3 space-y-2">
                      <p className="text-sm font-display font-bold text-accent flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Pending P2P Manual Rake
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Seller must pay the 8% P2P fee via CashApp ($fishkillerzstaking). Confirm receipt below.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={loadingId === s.id}
                          onClick={() => handleConfirmManualRake(s)}
                          className="gradient-primary text-primary-foreground font-display font-bold text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Confirm Fee Received
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingId === s.id}
                          onClick={() => handleLateManualRake(s)}
                          className="text-destructive border-destructive/30 text-xs"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" /> Mark Late (-5 Score)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">All Users</h2>
            {users.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No users yet.</p>
              </div>
            ) : (
              <div className="gradient-card rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-foreground text-sm">{u.display_name}</p>
                              {u.is_shadow_banned && (
                                <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-muted-foreground/30 text-[10px] gap-0.5 px-1.5 py-0">
                                  👻 Ghost
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-primary">@{u.username}</p>
                            <p className="text-[10px] text-muted-foreground">{u.user_id.slice(0, 8)}...</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r) => (
                              <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            u.seller_status === "active" ? "bg-success/20 text-success border-success/30" :
                            u.seller_status === "banned" ? "bg-destructive/20 text-destructive border-destructive/30" :
                            u.seller_status === "pending" ? "bg-accent/20 text-accent border-accent/30" :
                            "bg-secondary text-muted-foreground"
                          }>
                            {u.seller_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.fraud_flags > 0 ? (
                            <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
                              🚩 {u.fraud_flags}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={!!u.verified}
                            onCheckedChange={() => handleToggleVerified(u)}
                            disabled={loadingId === u.user_id}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loadingId === u.user_id}
                              onClick={() => handleBanUser(u)}
                              className={u.seller_status === "banned"
                                ? "text-success border-success/30 text-xs"
                                : "text-destructive border-destructive/30 text-xs"
                              }
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              {u.seller_status === "banned" ? "Unban" : "Ban"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loadingId === u.user_id}
                              onClick={() => handleShadowBan(u)}
                              className={u.is_shadow_banned
                                ? "text-accent border-accent/30 text-xs"
                                : "text-muted-foreground border-muted/30 text-xs"
                              }
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {u.is_shadow_banned ? "Unshadow" : "Shadow Ban"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={loadingId === u.user_id}
                              onClick={() => handleRemoveUser(u)}
                              className="text-xs"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Confirmed Sellers */}
          <TabsContent value="confirmed-sellers" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Confirmed Sellers</h2>
            {confirmedSellers.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No confirmed sellers yet.</p>
              </div>
            ) : (
              <div className="gradient-card rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmedSellers.map((s) => (
                      <TableRow key={s.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground text-sm">{s.display_name}</p>
                            <p className="text-xs text-primary">@{s.username}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.email || "—"}</TableCell>
                        <TableCell>
                          <Badge className="bg-success/20 text-success border-success/30 text-[10px]">
                            <CheckCircle className="h-3 w-3 mr-1" /> Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {s.verified ? (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">✓ Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Unverified</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Confirmed Agents */}
          <TabsContent value="agents" className="space-y-4 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Confirmed Agents</h2>
            <p className="text-xs text-muted-foreground">Reputable agents that sellers can use when creating sessions.</p>

            {/* Add Agent Form */}
            <div className="gradient-card rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-foreground text-sm">Add New Agent</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Agent Name</Label>
                  <Input
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="e.g. Agent Mike"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                  <Input
                    value={newAgentNotes}
                    onChange={(e) => setNewAgentNotes(e.target.value)}
                    placeholder="e.g. Fast payouts, reliable"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddAgent}
                disabled={loadingId === "add-agent"}
                className="gradient-primary text-primary-foreground font-display font-bold text-xs"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Agent
              </Button>
            </div>

            {/* Agents List */}
            {agents.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No agents added yet.</p>
              </div>
            ) : (
              <div className="gradient-card rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-foreground">{a.agent_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.notes || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loadingId === a.id}
                            onClick={() => handleDeleteAgent(a)}
                            className="text-destructive border-destructive/30 text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Wallet Ledger */}
          <TabsContent value="wallet-ledger" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Pending Wallet Transactions</h2>
            {walletTxns.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No pending wallet transactions.</p>
              </div>
            ) : (
              walletTxns.map((tx) => (
                <div key={tx.id} className="gradient-card rounded-lg p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-md shrink-0 ${tx.type === "deposit" ? "bg-success/20" : "bg-accent/20"}`}>
                      <Wallet className={`h-4 w-4 ${tx.type === "deposit" ? "text-success" : "text-accent"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.user_profile?.display_name || "Unknown"}
                        {tx.user_profile?.username && <span className="text-primary ml-1">@{tx.user_profile.username}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="capitalize font-medium">{tx.type}</span> • ${Number(tx.amount).toFixed(2)} • {tx.payment_method || "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === tx.id}
                      onClick={() => handleRejectTransaction(tx)}
                      className="text-destructive border-destructive/30 text-xs"
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={loadingId === tx.id}
                      onClick={() => tx.type === "deposit" ? handleApproveDeposit(tx) : handleApproveWithdrawal(tx)}
                      className="gradient-primary text-primary-foreground font-display font-bold text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* ID Verification Tab */}
          <TabsContent value="id-verification" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Pending ID Verifications</h2>
            {pendingVerifications.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No pending verifications.</p>
              </div>
            ) : (
              pendingVerifications.map((pv) => (
                <div key={pv.user_id} className="gradient-card rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-foreground">{pv.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{pv.username} • {pv.email}</p>
                    </div>
                    <Badge className="bg-accent/20 text-accent border-accent/30">Pending</Badge>
                  </div>

                  {verificationImages[pv.user_id] ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Uploaded ID:</p>
                      <a href={verificationImages[pv.user_id]} target="_blank" rel="noopener noreferrer">
                        <img
                          src={verificationImages[pv.user_id]}
                          alt="User ID"
                          className="max-w-full max-h-64 rounded-md border border-border object-contain"
                        />
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-destructive">No ID image found</p>
                  )}

                  <div className="space-y-2">
                    <Input
                      placeholder="Rejection note (optional)"
                      value={verificationNotes[pv.user_id] || ""}
                      onChange={(e) => setVerificationNotes((prev) => ({ ...prev, [pv.user_id]: e.target.value }))}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleVerificationAction(pv, "verified")}
                        disabled={loadingId === pv.user_id}
                        className="gradient-primary text-primary-foreground font-display font-bold text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleVerificationAction(pv, "rejected")}
                        disabled={loadingId === pv.user_id}
                        className="font-display font-bold text-xs"
                      >
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-destructive" /> Dispute Review
            </h2>
            <p className="text-xs text-muted-foreground">
              Sessions flagged as disputed. Review deposit &amp; payout proofs side-by-side.
            </p>
            <DisputeReview />
          </TabsContent>

          {/* OCR Monitor Tab */}
          <TabsContent value="ocr-monitor" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> OCR Scan Monitor
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time AI screenshot analysis results and flagged sessions.
            </p>
            <OcrDashboardWidget />
          </TabsContent>

          {/* Transaction Logs Tab */}
          <TabsContent value="txn-logs" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" /> Transaction Logs
            </h2>
            <p className="text-xs text-muted-foreground">
              Searchable history of all deposits, withdrawals, stakes, and payouts.
            </p>
            <TransactionLogs />
          </TabsContent>

          {/* God Mode Tab */}
          <TabsContent value="godmode" className="space-y-6 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-accent" />
              <h2 className="font-display text-lg font-bold text-accent">GOD MODE</h2>
              <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
                <AlertTriangle className="h-3 w-3 mr-1" /> Owner Only
              </Badge>
            </div>

            {/* Manual Payout Override */}
            <div className="gradient-card rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-success" />
                <h3 className="font-display font-bold text-foreground">Manual Payout Override</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Force-create a payout for a user on a session (e.g. crash/video proof override).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Session ID</Label>
                  <select
                    value={manualPayoutSessionId}
                    onChange={(e) => setManualPayoutSessionId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select session</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shooter_name} — {s.platform} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">User ID</Label>
                  <select
                    value={manualPayoutUserId}
                    onChange={(e) => setManualPayoutUserId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select user</option>
                    {users.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.display_name} (@{u.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Amount ($)</Label>
                  <Input
                    type="number"
                    value={manualPayoutAmount}
                    onChange={(e) => setManualPayoutAmount(e.target.value)}
                    placeholder="500"
                    className="bg-secondary border-border text-foreground"
                    min={1}
                  />
                </div>
              </div>
              <Button
                onClick={handleManualPayout}
                disabled={loadingId === "manual-payout"}
                className="gradient-primary text-primary-foreground font-display font-bold text-xs"
              >
                <Send className="h-3 w-3 mr-1" /> Force Create Payout
              </Button>
            </div>

            {/* Session Status Override */}
            <div className="gradient-card rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-foreground">Session Status Override</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Force-change the status of any session (e.g. mark disputed, cancel, reopen).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Session</Label>
                  <select
                    value={overrideSessionId}
                    onChange={(e) => setOverrideSessionId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select session</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shooter_name} — {s.platform} [{s.status}]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">New Status</Label>
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="funding">Funding</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="disputed">Disputed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={handleStatusOverride}
                disabled={loadingId === "status-override"}
                className="gradient-primary text-primary-foreground font-display font-bold text-xs"
              >
                <Zap className="h-3 w-3 mr-1" /> Override Status
              </Button>
            </div>

            {/* Platform Fee Info */}
            <div className="gradient-card rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent" />
                <h3 className="font-display font-bold text-foreground">Auto-Rake Settings</h3>
              </div>
              <div className="bg-secondary rounded-md p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commission Rate</span>
                  <span className="text-accent font-display font-bold">5% / 2% VIP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seller Registration Fee</span>
                  <span className="text-primary font-display font-bold">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seller Skin-in-the-Game Min</span>
                  <span className="text-foreground font-display font-bold">25%</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Fixed global rate. Applied automatically on every session settlement.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
