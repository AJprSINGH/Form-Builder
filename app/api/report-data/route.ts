import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { formId, xKey, yKey, chartType } = await req.json();

    if (!formId || !xKey || (chartType !== 'pie' && !yKey)) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    console.log("X-Key:", xKey);
    console.log("Y-Key:", yKey);
    console.log("Chart Type:", chartType);
    
    // Fetch all submissions for the form
    const submissions = await prisma.formSubmissions.findMany({
      where: { formId: Number(formId) },
      select: { content: true },
    });
    
    console.log("Received formId:", formId);
    console.log("Submissions fetched:", submissions);

    // Parse the submission content to get the raw data
    const rawData = submissions.map((s) => JSON.parse(s.content));
    const result: any[] = [];

    if (chartType === 'pie') {
      const counts: Record<string, number> = {};

      // Count occurrences of xKey and optionally sum yKey
      rawData.forEach((entry) => {
        const label = entry[xKey];
        if (!label) return;

        const numericValue = yKey ? parseFloat(entry[yKey]) : 1;
        if (yKey && isNaN(numericValue)) return;

        // Aggregate the values for each xKey
        if (!counts[label]) counts[label] = 0;
        counts[label] += numericValue;
      });

      // Push result formatted for the pie chart
      for (const [key, value] of Object.entries(counts)) {
        result.push({ name: key, value });
      }
    } else { // For bar/line charts
      const grouped: Record<string, number> = {};

      // Group the data by xKey and sum the yKey values
      rawData.forEach((entry) => {
        const x = entry[xKey];
        const y = parseFloat(entry[yKey]);

        if (!x || isNaN(y)) return;

        // Aggregate the yKey value for each xKey
        if (!grouped[x]) grouped[x] = 0;
        grouped[x] += y;
      });

      // Push grouped result formatted for the bar/line chart
      for (const [key, value] of Object.entries(grouped)) {
        result.push({ [xKey]: key, [yKey]: value });
      }
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}