import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Clock, Crosshair, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export default function WalletTab() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", user.id)
      .single();
    if (data) setBalance(Number((data as any).balance) || 0);
  };

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setTransactions(data as any);
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, [user]);

  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || !paymentMethod) {
      toast.error("Enter a valid amount and payment method");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user!.id,
        amount: val,
        type: "deposit",
        status: "pending",
        payment_method: paymentMethod,
      } as any);
      if (error) throw error;
      toast.success(`Deposit of $${val} submitted for review`);
      setAmount("");
      setPaymentMethod("");
      setDepositOpen(false);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit deposit");
    }
    setSubmitting(false);
  };

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || !paymentMethod) {
      toast.error("Enter a valid amount and payment method");
      return;
    }
    if (val > balance) {
      toast.error("Insufficient balance");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user!.id,
        amount: val,
        type: "withdrawal",
        status: "pending",
        payment_method: paymentMethod,
      } as any);
      if (error) throw error;
      toast.success(`Withdrawal of $${val} submitted for review`);
      setAmount("");
      setPaymentMethod("");
      setWithdrawOpen(false);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit withdrawal");
    }
    setSubmitting(false);
  };

  const statusColor: Record<string, string> = {
    pending: "bg-accent/20 text-accent border-accent/30",
    confirmed: "bg-success/20 text-success border-success/30",
    settled: "bg-primary/20 text-primary border-primary/30",
    rejected: "bg-destructive/20 text-destructive border-destructive/30",
  };

  const typeIcon: Record<string, string> = {
    deposit: "↓",
    withdrawal: "↑",
    stake: "🎯",
    payout: "💰",
  };

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="gradient-card rounded-lg p-6 text-center">
        <Wallet className="h-8 w-8 text-primary mx-auto mb-2" />
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-1">FishDollarz Balance</p>
        <p className="text-3xl font-display font-bold text-foreground">${balance.toFixed(2)}</p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground font-display font-bold text-sm">
              <ArrowDownCircle className="h-4 w-4 mr-2" /> Deposit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">Deposit FishDollarz</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Amount ($)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50"
                  min={1}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Payment Method Used</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CashApp">CashApp</SelectItem>
                    <SelectItem value="Venmo">Venmo</SelectItem>
                    <SelectItem value="Chime">Chime</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="BTC Lightning">BTC Lightning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Send payment to admin, then submit this form. Admin will confirm receipt and credit your balance.
              </p>
              <Button
                onClick={handleDeposit}
                disabled={submitting}
                className="w-full gradient-primary text-primary-foreground font-display font-bold"
              >
                {submitting ? "Submitting..." : "Submit Deposit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-primary/30 text-primary font-display font-bold text-sm">
              <ArrowUpCircle className="h-4 w-4 mr-2" /> Withdraw
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">Withdraw FishDollarz</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Amount ($)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50"
                  min={1}
                  max={balance}
                  className="bg-secondary border-border text-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Available: ${balance.toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Payout Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CashApp">CashApp</SelectItem>
                    <SelectItem value="Venmo">Venmo</SelectItem>
                    <SelectItem value="Chime">Chime</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="BTC Lightning">BTC Lightning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Admin will process your withdrawal and send payment to your preferred method.
              </p>
              <Button
                onClick={handleWithdraw}
                disabled={submitting}
                className="w-full gradient-primary text-primary-foreground font-display font-bold"
              >
                {submitting ? "Submitting..." : "Request Withdrawal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Disclaimer */}
      <p className="text-[9px] text-muted-foreground/60 text-center italic">
        FishDollarz are virtual items with no real-world value outside the FishKillerz platform.
      </p>

      {/* Transaction History */}
      <div>
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="gradient-card rounded-lg p-6 text-center">
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="gradient-card rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{typeIcon[tx.type] || "•"}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{tx.type}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {tx.payment_method || "—"} • {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-display font-bold ${tx.type === "deposit" || tx.type === "payout" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "deposit" || tx.type === "payout" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                  </p>
                  <Badge variant="outline" className={`text-[10px] ${statusColor[tx.status] || ""}`}>
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
