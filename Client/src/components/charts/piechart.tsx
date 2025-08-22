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
  totalClicks?: number;
}

export default function Component({ data, totalClicks }: PieChartProps) {
  // Use provided totalClicks or fallback to sum of data values
  const displayTotalClicks = totalClicks !== undefined ? totalClicks : data.reduce((sum, entry) => sum + entry.value, 0);
  return (
    <Card className="flex flex-col shadow-none border border-none bg-[#F8FAFC] dark:bg-[#0F1221] rounded-lg sm:rounded-xl">
      <CardHeader className="items-center pb-0">
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex flex-col items-center px-2 sm:px-6">
        <div className="w-full flex justify-center">
          <div className="w-[200px] h-[200px] sm:w-[250px] sm:h-[200px]">
            <PieChart width={200} height={180} className="sm:!w-[200px] sm:!h-[200px]">
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                paddingAngle={0}
                stroke="none"
                label={false}
                className="sm:!outerRadius-[90px]"
                // No activeShape, no onClick, no activeIndex
              />
              <Tooltip
                contentStyle={{ 
                  background: "#fff", 
                  border: "none", 
                  borderRadius: 8, 
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  fontSize: "14px"
                }}
                itemStyle={{ color: "#5B6B7A", fontSize: 14 }}
                formatter={(value: number, name: string) => [`${value}`, name]}
              />
            </PieChart>
          </div>
        </div>
        <div className="text-center font-bold text-lg sm:text-xl mt-2 dark:text-white text-[#5B6B7A] tracking-wider px-2">
          Total Clicks = {displayTotalClicks}
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-8 mt-4 w-full">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 justify-center sm:justify-start">
              <span style={{
                display: "inline-block",
                width: 16,
                height: 16,
                background: item.fill,
                borderRadius: 3,
              }} 
              className="sm:w-5 sm:h-5 sm:rounded-[4px] flex-shrink-0"
              />
              <span className="text-[#5B6B7A] dark:text-white text-sm sm:text-[16px] whitespace-nowrap">
                {item.name} = {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
