import { useState } from "react";
import { Pie, PieChart, Sector, Tooltip } from "recharts";
import { useDashboardAnalytics } from "../../backend/analytics.service";

const renderActiveShape = (props: {
  cx: any;
  cy: any;
  innerRadius: any;
  outerRadius: any;
  startAngle: any;
  endAngle: any;
  fill: any;
}) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;

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

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  data,
}: {
  active?: boolean;
  payload?: any[];
  data: ChartData[];
}) => {
  if (active && payload && payload.length) {
    const total = data.reduce(
      (sum: number, entry: ChartData) => sum + entry.value,
      0
    );
    return (
      <div
        className="bg-white p-3 rounded-md shadow-lg border border-gray-200"
        style={{ position: "absolute", zIndex: 1000, pointerEvents: "none" }}
      >
        <p className="font-medium text-gray-800">{payload[0].name}</p>
        <p className="text-gray-600">
          Count: <span className="font-semibold">{payload[0].value}</span>
        </p>
        <p className="text-gray-600">
          Percentage:{" "}
          <span className="font-semibold">
            {((payload[0].value / total) * 100).toFixed(1)}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export function DonutChart() {
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: analytics, isLoading } = useDashboardAnalytics();

  const data = [
    {
      name: "Active users",
      value: analytics?.activeUsers || 0,
      fill: "#D946EF",
    },
    {
      name: "Non-active",
      value: analytics?.inactiveUsers || 0,
      fill: "#F5D0FE",
    },
  ];

  const total = analytics ? analytics.activeUsers + analytics.inactiveUsers : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D946EF]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between max-w-4xl mx-auto gap-6">
      {/* Chart container */}
      <div className="relative w-full lg:w-80 h-64 sm:h-80 flex items-center justify-center">
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
            activeShape={(props: unknown) =>
              renderActiveShape(
                props as {
                  cx: any;
                  cy: any;
                  innerRadius: any;
                  outerRadius: any;
                  startAngle: any;
                  endAngle: any;
                  fill: any;
                }
              )
            }
            onMouseEnter={(_, index) => setActiveIndex(index)}
          />
          <Tooltip
            content={<CustomTooltip data={data} />}
            wrapperStyle={{ zIndex: 1000 }}
          />
        </PieChart>
        <div
          className="absolute text-6xl font-black text-gray-800 dark:text-white"
          style={{ fontFamily: "Impact, sans-serif", zIndex: 1 }}
        >
          {total}
        </div>
      </div>

      {/* Legend section */}
      <div className="mt-4 lg:mt-12 flex flex-col space-y-4 font-dmmono w-full lg:w-auto">
        <div className="text-lg lg:text-xl text-gray-600 font-medium dark:text-white text-center lg:text-left">
          Total number of registered users = {total}
        </div>

        <div className="space-y-3">
          {data.map((_entry, index) => (
            <div
              key={`legend-${index}`}
              className="flex items-center justify-center lg:justify-start cursor-pointer"
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div
                className="w-5 h-5 mr-3"
                style={{ backgroundColor: index === 0 ? "#D946EF" : "#F5D0FE" }}
              ></div>
              <span className="text-base lg:text-lg text-gray-600 dark:text-white">
                {index === 0 ? "Active users" : "Non-active"} = {_entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
