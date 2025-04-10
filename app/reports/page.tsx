'use client';

import { useEffect, useState } from 'react';
import ChartRenderer from '@/components/ChartRenderer';
import axios from 'axios';

export default function ReportsPage() {
    const [forms, setForms] = useState<any[]>([]);
    const [selectedForm, setSelectedForm] = useState<string>('');
    const [fields, setFields] = useState<string[]>([]);
    const [xKey, setXKey] = useState('');
    const [yKey, setYKey] = useState('');
    const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        // Fetch forms
        axios.get('/api/forms').then((res) => setForms(res.data.forms));
    }, []);

    useEffect(() => {
        if (selectedForm) {
            // Fetch unique keys from recent submissions
            axios.get(`/api/form-fields?formId=${selectedForm}`).then((res) => setFields(res.data.fields));
        }
    }, [selectedForm]);

    const generateReport = async () => {
        const res = await axios.post('/api/report-data', {
            formId: selectedForm,
            xKey,
            yKey,
            chartType
        });
        setChartData(res.data.data);
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Dynamic Report Builder</h1>

            <div className="space-y-4">
                <select className="w-full p-2 border" onChange={(e) => setSelectedForm(e.target.value)} value={selectedForm}>
                    <option value="">Select a Form</option>
                    {forms.map((form) => (
                        <option key={form.id} value={form.id}>{form.name}</option>
                    ))}
                </select>

                <div className="grid grid-cols-3 gap-4">
                    <select className="p-2 border" onChange={(e) => setXKey(e.target.value)} value={xKey}>
                        <option value="">X-axis</option>
                        {fields.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>

                    <select className="p-2 border" onChange={(e) => setYKey(e.target.value)} value={yKey}>
                        <option value="">Y-axis</option>
                        {fields.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>

                    <select className="p-2 border" onChange={(e) => setChartType(e.target.value as any)} value={chartType}>
                        <option value="bar">Bar</option>
                        <option value="line">Line</option>
                        <option value="pie">Pie</option>
                    </select>
                </div>

                <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={generateReport}>
                    Generate Report
                </button>
            </div>

            <div className="mt-6">
                {chartData.length > 0 && (
                    <ChartRenderer type={chartType} data={chartData} xKey={xKey} yKey={yKey} />
                )}
            </div>
        </div>
    );
}
