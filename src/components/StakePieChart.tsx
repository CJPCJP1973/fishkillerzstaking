import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StakePieChartProps {
  available: number;
  pending: number;
  sold: number;
  sharePrice: number;
  onClickAvailable?: () => void;
}

const COLORS = {
  available: "hsl(150, 80%, 45%)",
  pending: "hsl(45, 100%, 50%)",
  sold: "hsl(0, 85%, 55%)",
};

export default function StakePieChart({ available, pending, sold, sharePrice, onClickAvailable }: StakePieChartProps) {
  const total = available + pending + sold;
  if (total === 0 || sharePrice <= 0) return null;

  // Calculate individual shares
  const availableShares = Math.floor(available / sharePrice);
  const pendingShares = Math.floor(pending / sharePrice);
  const soldShares = Math.floor(sold / sharePrice);
  const totalShares = availableShares + pendingShares + soldShares;

  if (totalShares === 0) return null;

  // Build individual slices — one per share
  const data: { name: string; value: number; color: string; label: string }[] = [];

  for (let i = 0; i < soldShares; i++) {
    data.push({ name: "Sold", value: 1, color: COLORS.sold, label: `Sold #${i + 1}` });
  }
  for (let i = 0; i < pendingShares; i++) {
    data.push({ name: "Pending", value: 1, color: COLORS.pending, label: `Pending #${i + 1}` });
  }
  for (let i = 0; i < availableShares; i++) {
    data.push({ name: "Available", value: 1, color: COLORS.available, label: `Available #${i + 1}` });
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={1}
            dataKey="value"
            stroke="hsl(var(--background))"
            strokeWidth={1}
            onClick={(_, index) => {
              if (data[index]?.name === "Available" && onClickAvailable) {
                onClickAvailable();
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className={entry.name === "Available" ? "hover:opacity-80 transition-opacity" : ""}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.[0]) {
                const d = payload[0].payload;
                return (
                  <div className="bg-card border border-border rounded px-2 py-1 text-xs shadow-lg">
                    <span className="text-foreground font-display font-bold">{d.label}</span>
                    <span className="text-muted-foreground ml-1">(${sharePrice})</span>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="font-display font-bold text-foreground text-lg">{totalShares}</p>
          <p className="text-[10px] text-muted-foreground">SHARES</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2">
        {[
          { label: "Available", color: "bg-success", value: availableShares },
          { label: "Pending", color: "bg-accent", value: pendingShares },
          { label: "Sold", color: "bg-destructive", value: soldShares },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${item.color}`} />
            <span className="text-[10px] text-muted-foreground">
              {item.label} ({item.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
