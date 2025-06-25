"use client"

import { Pie, PieChart, Tooltip } from "recharts"

import {
  Card,
  CardContent,
//   CardDescription,
  CardHeader,
//   CardTitle,
} from "../ui/card"
// import {
//   type ChartConfig,
//   ChartContainer,
//   ChartLegend,
//   ChartLegendContent,
// } from "./chart"
interface ChartData {
  name: string;
  value: number;
  fill: string;
}

interface PieChartProps {
  data: ChartData[];
}

export default function Component({ data }: PieChartProps) {
  const totalClicks = data.reduce((sum, entry) => sum + entry.value, 0);
  return (
    <Card className="flex flex-col shadow-none border border-none bg-[#F8FAFC] dark:bg-[#0F1221]">
      <CardHeader className="items-center pb-0">
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex flex-col items-center">
        <PieChart width={250} height={250}>
          <Pie
            data={data}
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
        <div className="text-center font-bold text-xl mt-2 dark:text-white text-[#5B6B7A] tracking-wider">
          Total Clicks = {totalClicks}
        </div>
        <div className="flex justify-center gap-8 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span style={{
                display: "inline-block",
                width: 20,
                height: 20,
                background: item.fill,
                borderRadius: 4,
              }} />
              <span className="text-[#5B6B7A] dark:text-white text-[16px]">
                {item.name} = {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
