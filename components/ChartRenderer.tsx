import React from "react";
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA66CC", "#FF4444"];

export default function ChartRenderer({
    type,
    data,
    xKey,
    yKey,
}: {
    type: "bar" | "line" | "pie" | "tabular";
    data: any[];
    xKey: string;
    yKey: string;
}) {
    if (!data || data.length === 0) {
        return <p className="text-center text-gray-500">No data available to render chart.</p>;
    }
    if (type === "tabular") {
        const uniqueKeys = new Set<string>([xKey, yKey]);
        // For multi-category bar/line case, also include dynamic keys
        data.forEach(row => Object.keys(row).forEach(k => uniqueKeys.add(k)));

        return (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full table-auto border-collapse text-sm text-left text-gray-600">
                    <thead className="bg-gray-100">
                        <tr>
                            {Array.from(uniqueKeys).map((key) => (
                                <th key={key} className="px-4 py-2 font-medium border-b">{key}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx} className="even:bg-gray-50">
                                {Array.from(uniqueKeys).map((key) => (
                                    <td key={key} className="px-4 py-2 border-b">
                                        {row[key] !== undefined ? row[key] : "-"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
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
                    <Pie
                        data={data}
                        dataKey="value"     // fixed for pie format
                        nameKey="name"       // fixed for pie format
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label
                    >
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
        <div className="w-full h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
                {chartElement}
            </ResponsiveContainer>
        </div>
    );
    
}
