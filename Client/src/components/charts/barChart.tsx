import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent } from "../../components/ui/card";
import { useSignupAnalyticsData } from "../../backend/signup.analytics.service";

const clickTypeLabels: Record<string, string> = {
  "navbar": "Navigation bar sign-up button clicks",
  "keep-playing": "Keep Playing Pop-up sign-up button clicks",
};

const colors = ["#F3C4FB", "#A21CAF"];

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
        {/* Improved layout for 2 bars */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: '400px' }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart layout="vertical" data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis 
                  type="number" 
                  domain={[0, Math.max(5, ...data.map((item: ChartDataPoint) => item.value))]}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={220}
                  tick={{
                    fill: "#64748B",
                    fontSize: 13,
                    fontFamily: "inherit",
                    fontWeight: 500
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    color: '#1f2937',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '12px 16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    fontSize: '14px',
                    fontWeight: '600',
                    minWidth: '120px'
                  }}
                  formatter={(value: number) => [
                    <span style={{ color: '#1f2937', fontWeight: '700' }}>{value} clicks</span>, 
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>Count</span>
                  ]}
                  labelStyle={{ 
                    color: '#374151', 
                    fontWeight: '700',
                    marginBottom: '6px',
                    fontSize: '13px'
                  }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Bar 
                  dataKey="value" 
                  barSize={80}
                  fill="#F3C4FB"
                  radius={[0, 8, 8, 0]}
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
