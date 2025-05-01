import React from "react";
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function ChartRenderer({ type, data, xKey, yKey }: {
    type: "bar" | "line" | "pie",
    data: any[],
    xKey: string,
    yKey: string
}) {
    if (!data || data.length === 0) {
        return <p className="text-center text-gray-500">No data available to render chart.</p>;
    }

    let chartElement: React.ReactElement;

    switch (type) {
        case "bar":
            chartElement = (
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={yKey} fill="#8884d8" />
                </BarChart>
            );
            break;
        case "line":
            chartElement = (
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey={yKey} stroke="#82ca9d" />
                </LineChart>
            );
            break;
        case "pie":
            chartElement = (
                <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={120} label>
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            );
            break;
        default:
            return <p className="text-center text-red-500">Invalid chart type: {type}</p>;
    }

    return (
        <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                {chartElement}
            </ResponsiveContainer>
        </div>
    );
}
