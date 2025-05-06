"use client";
import { Mars, Venus } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const CountChart = ({ boys, girls }: { boys: number; girls: number }) => {
  const data = [
    {
      name: "Total",
      count: boys + girls,
      fill: "white",
    },
    {
      name: "Femenino",
      count: girls,
      fill: "#e53e3e",
    },
    {
      name: "Masculino",
      count: boys,
      fill: "#000",
    },
  ];
  return (
    <div className="relative w-full h-[75%]">
      <ResponsiveContainer>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="100%"
          barSize={32}
          data={data}
        >
          <RadialBar background dataKey="count" />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex justify-center items-center ">
          <Mars size={50} className="text-[#000] mr-2" />
          <Venus size={50} className="text-[#e53e3e] mr-2" />
        </div>
      </div>
    </div>
  );
};

export default CountChart;
