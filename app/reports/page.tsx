'use client';

import { useEffect, useState } from 'react';
import ChartRenderer from '@/components/ChartRenderer';
import axios from 'axios';

interface FormField {
    id: string;
    label: string;
    type: string;
    extraAttributes: any;
}
//test commit 1
export default function ReportsPage() {
    const [forms, setForms] = useState<any[]>([]);
    const [selectedForm, setSelectedForm] = useState<string>('');
    const [fields, setFields] = useState<FormField[]>([]);
    const [xKey, setXKey] = useState('');
    const [yKey, setYKey] = useState('');
    const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'tabular'>('bar');
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        // Fetch published forms
        const fetchForms = async () => {
            try {
                const res = await axios.get('/api/published-forms');
                setForms(res.data);
            } catch (error) {
                console.error('Error fetching forms:', error);
            }
        };

        fetchForms();
    }, []);

    useEffect(() => {
        if (selectedForm) {
            // Fetch fields for selected form
            const fetchFields = async () => {
                try {
                    const res = await axios.get(`/api/forms/${selectedForm}/fields`);
                    setFields(res.data);
                } catch (error) {
                    console.error('Error fetching form fields:', error);
                }
            };

            fetchFields();
        } else {
            setFields([]);
            setXKey('');
            setYKey('');
        }
    }, [selectedForm]);

    const generateReport = async () => {
        if (!selectedForm || !xKey || !yKey) return;

        try {
            const res = await axios.post('/api/report-data-new', {
                formId: selectedForm,
                xKey,
                yKey,
                chartType
            });
            setChartData(res.data.data);
        } catch (error) {
            console.error('Error generating report:', error);
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Dynamic Report Builder</h1>

            <div className="space-y-4">
                <select className="w-full p-2 border" onChange={(e) => setSelectedForm(e.target.value)} value={selectedForm}>
                    <option value="">Select a Form</option>
                    {forms?.map((form) => (
                        <option key={form.id} value={form.id}>{form.name}</option>
                    ))}
                </select>

                <div className="grid grid-cols-3 gap-4">
                    <select className="p-2 border" onChange={(e) => setXKey(e.target.value)} value={xKey}>
                        <option value="">X-axis</option>
                        {fields?.map((field) => (
                            <option key={field.id} value={field.id}>
                                {field.extraAttributes?.label || field.label}
                            </option>
                        ))}
                    </select>

                    <select className="p-2 border" onChange={(e) => setYKey(e.target.value)} value={yKey}>
                        <option value="">Y-axis</option>
                        {fields?.map((field) => (
                            <option key={field.id} value={field.id}>
                                {field.extraAttributes?.label || field.label}
                            </option>
                        ))}
                    </select>

                    <select className="p-2 border" onChange={(e) => setChartType(e.target.value as any)} value={chartType}>
                        <option value="bar">Bar</option>
                        <option value="line">Line</option>
                        <option value="pie">Pie</option>
                        <option value="tabular">Tabular</option>
                    </select>
                </div>

                <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={generateReport}>
                    Generate Report
                </button>
            </div>

            <div className="mt-6 min-h-screen">
                {chartData.length > 0 && (
                    <ChartRenderer type={chartType} data={chartData} xKey={xKey} yKey={yKey} />
                )}
            </div>
        </div>
    );
}
