// import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "../../components/ui/card";

const data = [
  { name: "sign-up button clicks from the pop up sign up", value: 60, fill: "#F3C4FB" },
  { name: "static sign up button on the header", value: 75, fill: "#D58DFB" },
  { name: "secondary sign up button clicks (the one inside the sign up form)", value: 90, fill: "#B86EF7" }
];

const HorizontalBarChart = () => {
  return (
    <Card className="w-full p-4 bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none rounded-2xl">
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart layout="vertical" data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="name"
              width={200}
              tick={{
                fill: "#fff", // default (slate-700)
                fontSize: 12,
                fontFamily: "inherit"
              }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip />
            <Bar dataKey="value" barSize={60} 
              fill="#F3C4FB"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default HorizontalBarChart;
