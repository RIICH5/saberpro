"use client";
import { PieChart, Pie, ResponsiveContainer } from "recharts";

const data = [
  { name: "Group A", value: 92, fill: "#e63e3e" },
  { name: "Group B", value: 8, fill: "#000" },
];

const Performance = () => {
  return (
    <div className="bg-white p-4 rounded-md h-80 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Desempeño de los alumnos</h1>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            fill="#e63e3e"
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <h1 className="text-3xl font-bold">9.2</h1>
        <p className="text-xs text-gray-300">de 10</p>
      </div>
      <h2 className="font-medium absolute bottom-16 left-0 right-0 m-auto text-center">
        De primer a segundo semestre
      </h2>
    </div>
  );
};

export default Performance;
