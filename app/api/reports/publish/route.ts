import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const { name, formId, xKey, yKey, chartType } = await req.json();

    if (!name || !formId || !xKey || !yKey || !chartType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a unique URL for the report
    const reportUrl = nanoid(10);

    // Create a new report in the database
    const report = await prisma.report.create({
      data: {
        name,
        formId: Number(formId),
        reportUrl,
        config: JSON.stringify({
          xKey,
          yKey,
          chartType
        })
      }
    });

    return NextResponse.json({
      success: true,
      reportUrl,
      reportId: report.id
    });
  } catch (error) {
    console.error('Error publishing report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}