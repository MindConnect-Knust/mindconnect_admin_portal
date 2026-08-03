import { ResponsiveContainer, LineChart, Line } from "recharts";

export default function Sparkline({ data, dataKey = "avgRating", color = "#4f46e5" }) {
  if (!data?.length) return <span className="text-xs text-slate-300">No data</span>;
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
