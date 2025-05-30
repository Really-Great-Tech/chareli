import {
	Bar,
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";
import { Card, CardContent } from "../ui/card";

interface UserAgeBarChartProps {
	adultsCount: number;
	minorsCount: number;
}

const UserAgeBarChart = ({ adultsCount, minorsCount }: UserAgeBarChartProps) => {
	console.log('Chart Props:', { adultsCount, minorsCount });
	
	const data = [
		{ name: "users under 18", value: minorsCount, fill: "#F3C4FB" },
		{ name: "users 18 and over", value: adultsCount, fill: "#B86EF7" },
	];
	
	console.log('Chart Data:', data);
	
	const maxValue = Math.max(adultsCount, minorsCount);
	console.log('Max Value:', maxValue);

	return (
		<Card className="w-full p-4 bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none rounded-2xl">
			<CardContent>
				<ResponsiveContainer width="100%" height={180}>
					<BarChart layout="vertical" data={data} barGap={40} barCategoryGap={80}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis
							type="number"
							domain={[0, maxValue > 0 ? maxValue : 100]}
							tick={{ fill: "#7B8FA1", fontSize: 14, fontFamily: "inherit" }}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis
							type="category"
							dataKey="name"
							width={200}
							tick={{ fill: "#7B8FA1", fontSize: 16, fontFamily: "inherit" }}
							axisLine={false}
							tickLine={false}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: "#fff",
								border: "1px solid #e2e8f0",
								borderRadius: "0.5rem",
								padding: "0.5rem",
							}}
						/>
						<Bar 
							dataKey="value" 
							barSize={70} 
							radius={[0, 4, 4, 0]}
						>
							{data.map((entry) => (
								<Cell key={entry.name} fill={entry.fill} />
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
};

export default UserAgeBarChart;
