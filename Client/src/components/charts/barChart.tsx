import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent } from "../../components/ui/card";
import { useSignupAnalyticsData } from "../../backend/signup.analytics.service";

const clickTypeLabels: Record<string, string> = {
  "navbar": "Navigation bar sign-up button clicks",
  // "signup-modal": "Form sign-up button clicks",
  "popup": "Pop-up sign-up button clicks",
};

const colors = ["#F3C4FB", "#D58DFB", "#B86EF7"];

const HorizontalBarChart = () => {
  const { data: analyticsData, isLoading, error, isError } = useSignupAnalyticsData(30); // Get last 30 days data
  
  console.log('Bar Chart State:', {
    analyticsData,
    isLoading,
    isError,
    error
  });

  if (isLoading) {
    return (
      <Card className="w-full p-4 bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none rounded-2xl">
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-gray-500">Loading chart data...</div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full p-4 bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none rounded-2xl">
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-red-500">Error loading chart data: {error instanceof Error ? error.message : 'Unknown error'}</div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card className="w-full p-4 bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none rounded-2xl">
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-gray-500">No click data available</div>
        </CardContent>
      </Card>
    );
  }

  interface ChartDataPoint {
    name: string;
    value: number;
    fill: string;
  }

  // Ensure all click types are represented
  const allClickTypes = ["navbar", "keep-playing"];
  const clicksMap = new Map(
    analyticsData.clicksByType?.map(click => [click.type, parseInt(click.count)]) || []
  );

  const data: ChartDataPoint[] = allClickTypes.map((type, index) => ({
    name: clickTypeLabels[type] || type,
    value: clicksMap.get(type) || 0,
    fill: colors[index % colors.length]
  }));

 
  return (
    <Card className="w-full p-4 bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none rounded-2xl">
      <CardContent>
        {/* Horizontally scrollable container for mobile responsiveness */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: '500px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart layout="vertical" data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  domain={[0, Math.max(5, ...data.map((item: ChartDataPoint) => item.value))]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={200}
                  tick={{
                    fill: "#64748B",
                    fontSize: 12,
                    fontFamily: "inherit"
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    padding: '0.5rem'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  barSize={60}
                  fill="#F3C4FB"
                  radius={[0, 4, 4, 0]}
                >
                  {data.map((entry: ChartDataPoint, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HorizontalBarChart;
