import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { formId, xKey, yKey, chartType } = await req.json();

        if (!formId || !xKey || !yKey) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const submissions = await prisma.submission.findMany({
            where: { formId },
        });

        const parsedData = submissions.map((sub) => {
            const values = sub.values as Record<string, any>;
            return {
                [xKey]: values[xKey],
                [yKey]: Number(values[yKey]) || 0,
            };
        }).filter((item) => item[xKey] !== undefined && item[yKey] !== undefined);

        // Optional: group data for pie charts (e.g., count of categories)
        let data = parsedData;
        if (chartType === 'pie') {
            const grouped: Record<string, number> = {};
            parsedData.forEach(({ [xKey]: label }) => {
                grouped[label] = (grouped[label] || 0) + 1;
            });
            data = Object.entries(grouped).map(([label, value]) => ({ [xKey]: label, [yKey]: value }));
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
