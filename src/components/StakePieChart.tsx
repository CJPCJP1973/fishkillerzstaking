import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface StakePieChartProps {
  available: number;
  pending: number;
  sold: number;
  onClickAvailable?: () => void;
}

const COLORS = {
  available: "hsl(150, 80%, 45%)",
  pending: "hsl(45, 100%, 50%)",
  sold: "hsl(0, 85%, 55%)",
};

export default function StakePieChart({ available, pending, sold, onClickAvailable }: StakePieChartProps) {
  const total = available + pending + sold;
  if (total === 0) return null;

  const data = [
    { name: "Available", value: available, color: COLORS.available },
    { name: "Pending", value: pending, color: COLORS.pending },
    { name: "Sold", value: sold, color: COLORS.sold },
  ].filter((d) => d.value > 0);

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
            paddingAngle={2}
            dataKey="value"
            stroke="none"
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
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="font-display font-bold text-foreground text-lg">${total.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">TOTAL</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2">
        {[
          { label: "Available", color: "bg-success", value: available },
          { label: "Pending", color: "bg-accent", value: pending },
          { label: "Sold", color: "bg-destructive", value: sold },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${item.color}`} />
            <span className="text-[10px] text-muted-foreground">
              {item.label} ${item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
