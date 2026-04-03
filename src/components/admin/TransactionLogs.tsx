import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionLog {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string | null;
  user_profile?: { display_name: string; username: string } | null;
}

type SortField = "created_at" | "amount" | "type" | "status";
type SortDir = "asc" | "desc";

export default function TransactionLogs() {
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) { setLoading(false); return; }

    const userIds = [...new Set((data as any[]).map((t: any) => t.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username")
      .in("user_id", userIds);

    setLogs((data as any[]).map((t: any) => ({
      ...t,
      user_profile: profiles?.find((p) => p.user_id === t.user_id) || null,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const filtered = logs
    .filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = t.user_profile?.display_name?.toLowerCase() || "";
        const uname = t.user_profile?.username?.toLowerCase() || "";
        const notes = t.notes?.toLowerCase() || "";
        const method = t.payment_method?.toLowerCase() || "";
        if (!name.includes(q) && !uname.includes(q) && !notes.includes(q) && !method.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "created_at") {
        cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      } else if (sortField === "amount") {
        cmp = a.amount - b.amount;
      } else if (sortField === "type") {
        cmp = a.type.localeCompare(b.type);
      } else if (sortField === "status") {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const typeColors: Record<string, string> = {
    deposit: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    withdrawal: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    stake: "bg-primary/20 text-primary border-primary/30",
    payout: "bg-accent/20 text-accent border-accent/30",
    registration_fee: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    settled: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    rejected: "bg-destructive/20 text-destructive border-destructive/30",
  };

  const uniqueTypes = [...new Set(logs.map((t) => t.type))];
  const uniqueStatuses = [...new Set(logs.map((t) => t.status))];

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, notes, payment method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border text-foreground"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {logs.length} transactions
      </p>

      {loading ? (
        <p className="text-muted-foreground text-sm text-center py-8">Loading transactions...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No transactions found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("created_at")}
                >
                  <span className="flex items-center text-xs">Date <SortIcon field="created_at" /></span>
                </TableHead>
                <TableHead className="text-xs">User</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("type")}
                >
                  <span className="flex items-center text-xs">Type <SortIcon field="type" /></span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => toggleSort("amount")}
                >
                  <span className="flex items-center justify-end text-xs">Amount <SortIcon field="amount" /></span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("status")}
                >
                  <span className="flex items-center text-xs">Status <SortIcon field="status" /></span>
                </TableHead>
                <TableHead className="text-xs hidden md:table-cell">Method</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tx) => (
                <TableRow key={tx.id} className="text-xs">
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    <span className="block text-[10px] opacity-60">
                      {tx.created_at ? new Date(tx.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground">{tx.user_profile?.display_name || "Unknown"}</span>
                    <span className="block text-[10px] text-muted-foreground">@{tx.user_profile?.username || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${typeColors[tx.type] || ""}`}>
                      {tx.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-display font-bold text-foreground">
                    ${tx.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[tx.status] || ""}`}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground capitalize">
                    {tx.payment_method || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                    {tx.notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
