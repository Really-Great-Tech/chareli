// import React from "react";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
//   Legend,
  CartesianGrid,
} from "recharts";

const data = [
  { time: "00-04hrs", today: 12, yesterday: 8 },
  { time: "04-08hrs", today: 7, yesterday: 14 },
  { time: "08-12hrs", today: 15, yesterday: 22 },
  { time: "12-16hrs", today: 20, yesterday: 13 },
  { time: "16-20hrs", today: 17, yesterday: 19 },
  { time: "20-24hrs", today: 21, yesterday: 28 },
];

const CustomLegend = () => (
  <div className="flex items-center gap-6 px-6 pt-6 pb-2">
    <span className="text-2xl">Peak Gaming Times</span>
    <div className="flex items-center gap-4 ml-2">
      <span className="flex items-center gap-2">
        <span className="text-2xl text-[#475568] mr-3">|</span>
        <span className="inline-block w-3 h-3 rounded-full bg-[#D946EF]" />
        <span className="font-thin text-[#475568] text-sm">Today</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full border-2 border-[#D946EF]" />
        <span className="font-thin text-[#475568] text-sm">Yesterday</span>
      </span>
    </div>
    <span className="ml-auto text-[#D946EF] font-normal">Last 24 hours ▼</span>
  </div>
);

export default function LineChart() {
  return (
    <div className="rounded-2xl p-0 w-full h-[320px] font-thin">
      <CustomLegend />
      <ResponsiveContainer width="100%" height="80%">
        <ReLineChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#64748A", fontSize: 14, fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 32]}
            tick={{ fill: "#64748A", fontSize: 14, fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}K`}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              borderRadius: 8,
              border: "none",
              boxShadow: "0 2px 8px #0001",
              fontFamily: "inherit",
            }}
            labelStyle={{ color: "#64748A", fontWeight: 500 }}
            formatter={(value: number) => `${value}k`}
          />
          <Line
            type="monotone"
            dataKey="today"
            stroke="#D946EF"
            strokeWidth={1}
            dot={false}
            activeDot={{ r: 6, fill: "#D946EF", stroke: "#fff", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="yesterday"
            stroke="#D946EF"
            strokeWidth={1}
            strokeDasharray="6 6"
            dot={false}
            activeDot={{ r: 6, fill: "#fff", stroke: "#D946EF", strokeWidth: 2 }}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
