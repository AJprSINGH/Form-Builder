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

    const submissions = await prisma.formSubmissions.findMany({
      where: { formId: Number(formId) },
      select: { content: true },
    });

    console.log("Received formId:", formId);
    console.log("Submissions fetched:", submissions);

    const rawData = submissions.map((s) => JSON.parse(s.content));
    const result: any[] = [];

    if (chartType === 'pie') {
      const counts: Record<string, number> = {};

      rawData.forEach((entry) => {
        const label = entry[xKey];
        const category = yKey ? entry[yKey] : null;

        if (!label) return;

        const finalLabel = category ? `${label} - ${category}` : label;

        if (!counts[finalLabel]) counts[finalLabel] = 0;
        counts[finalLabel] += 1;
      });

      for (const [key, value] of Object.entries(counts)) {
        result.push({ name: key, value });
      }
    }

    else if (chartType === 'tabular') {
      rawData.forEach((entry) => {
        if (entry[xKey] && entry[yKey]) {
          result.push({
            [xKey]: entry[xKey],
            [yKey]: entry[yKey],
          });
        }
      });
    }

    else if (chartType === 'bar' || chartType === 'line') {
      const isNumeric = rawData.some((entry) => !isNaN(parseFloat(entry[yKey])));

      if (isNumeric) {
        const grouped: Record<string, number> = {};

        rawData.forEach((entry) => {
          const x = entry[xKey];
          const y = parseFloat(entry[yKey]);

          if (!x || isNaN(y)) return;

          if (!grouped[x]) grouped[x] = 0;
          grouped[x] += y;
        });

        for (const [key, value] of Object.entries(grouped)) {
          result.push({ [xKey]: key, [yKey]: value });
        }
      } else {
        const categoryCounts: Record<string, Record<string, number>> = {};

        rawData.forEach((entry) => {
          const x = entry[xKey];
          const y = entry[yKey];

          if (!x || !y) return;

          if (!categoryCounts[x]) categoryCounts[x] = {};
          if (!categoryCounts[x][y]) categoryCounts[x][y] = 0;

          categoryCounts[x][y] += 1;
        });

        // Transform to flat result for charts
        Object.entries(categoryCounts).forEach(([xVal, yCategories]) => {
          const row: Record<string, any> = { [xKey]: xVal };
          Object.entries(yCategories).forEach(([yVal, count]) => {
            row[yVal] = count;
          });
          result.push(row);
        });
      }
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
