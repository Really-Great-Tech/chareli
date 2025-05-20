/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Pie, PieChart, Sector, Tooltip } from "recharts";

const data = [
  { name: "Active users", value: 104, fill: "#D946EF" },
  { name: "Non-active", value: 30, fill: "#F5D0FE" }
];

// Custom active shape component to create the expansion effect
const renderActiveShape = (props: { cx: any; cy: any; innerRadius: any; outerRadius: any; startAngle: any; endAngle: any; fill: any; }) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-md shadow-lg border border-gray-200" style={{ position: 'absolute', zIndex: 1000, pointerEvents: 'none' }}>
        <p className="font-medium text-gray-800">{payload[0].name}</p>
        <p className="text-gray-600">Count: <span className="font-semibold">{payload[0].value}</span></p>
        <p className="text-gray-600">Percentage: <span className="font-semibold">
          {((payload[0].value / data.reduce((sum, entry) => sum + entry.value, 0)) * 100).toFixed(1)}%
        </span></p>
      </div>
    );
  }
  return null;
};

export function DonutChart() {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  // Set active index to 0 (first segment) to make it expanded
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex items-start justify-between max-w-3xl mx-auto">
      {/* Left side with chart */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        <PieChart width={300} height={300}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={120}
            dataKey="value"
            stroke="none"
            startAngle={90}
            endAngle={-270}
            activeIndex={activeIndex}
            activeShape={(props: unknown) => renderActiveShape(props as { cx: any; cy: any; innerRadius: any; outerRadius: any; startAngle: any; endAngle: any; fill: any; })}
            onMouseEnter={(_, index) => setActiveIndex(index)}
          />
          <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }} />
        </PieChart>
        <div className="absolute text-6xl font-black text-gray-800 dark:text-white" style={{ fontFamily: 'Impact, sans-serif', zIndex: 1 }}>
          {total}
        </div>
      </div>

      {/* Right side with legend */}
      <div className="mt-12 flex flex-col space-y-4">
        <div className="text-xl text-gray-600 font-medium dark:text-white">
          Total number of registered users = {total}
        </div>
        
        <div className="space-y-3">
          {data.map((entry, index) => (
            <div 
              key={`legend-${index}`} 
              className="flex items-center cursor-pointer"
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="w-5 h-5 mr-3" style={{ backgroundColor: index === 0 ? "#F5D0FE" : "#D946EF" }}></div>
              <span className="text-lg text-gray-600 font-pincuk dark:text-white">
                {index === 0 ? "Non-active" : "Active users"} = {index === 0 ? 30 : 104}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}