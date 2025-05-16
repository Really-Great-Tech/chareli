"use client"

import { Pie, PieChart, Tooltip } from "recharts"

import {
  Card,
  CardContent,
//   CardDescription,
  CardHeader,
//   CardTitle,
} from "./card"
// import {
//   type ChartConfig,
//   ChartContainer,
//   ChartLegend,
//   ChartLegendContent,
// } from "./chart"
const chartData = [
  { name: "Didn't register", value: 30, fill: "#F3C7FA" },
  { name: "Verified users", value: 104, fill: "#D24CFB" },
]

const totalClicks = chartData.reduce((sum, entry) => sum + entry.value, 0)

export default function Component() {
  return (
    <Card className="flex flex-col shadow-none border border-none bg-[#F8FAFC]">
      <CardHeader className="items-center pb-0">
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex flex-col items-center">
        <PieChart width={250} height={250}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            paddingAngle={0}
            stroke="none"
            label={false}
            // No activeShape, no onClick, no activeIndex
          />
          <Tooltip
            contentStyle={{ background: "#fff", border: "none", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            itemStyle={{ color: "#5B6B7A", fontSize: 16 }}
            formatter={(value: number, name: string) => [`${value}`, name]}
          />
        </PieChart>
        <div className="text-center font-bold text-4xl mt-2" style={{ color: "#5B6B7A" }}>
          Total Clicks = {totalClicks}
        </div>
        <div className="flex justify-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <span style={{
              display: "inline-block",
              width: 20,
              height: 20,
              background: "#F3C7FA",
              borderRadius: 4,
            }} />
            <span style={{ color: "#5B6B7A", fontSize: 18 }}>Didn&apos;t register = 30</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{
              display: "inline-block",
              width: 20,
              height: 20,
              background: "#D24CFB",
              borderRadius: 4,
            }} />
            <span style={{ color: "#5B6B7A", fontSize: 18 }}>Verified users = 104</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
