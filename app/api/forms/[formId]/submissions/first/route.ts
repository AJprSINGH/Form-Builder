import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma'; // adjust if your path is different

export async function GET(request: Request, { params }: { params: { formId: string } }) {
    const formId = parseInt(params.formId, 10);

    if (isNaN(formId)) {
        return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    try {
        const submissions = await prisma.formSubmissions.findMany({
            where: {
                formId: formId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                content: true,
            },
        });

        if (!submissions || submissions.length === 0) {
            return NextResponse.json({}, { status: 200 }); // No submission yet
        }
        const data = submissions.map(submission => JSON.parse(submission.content));
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching form submission:", error);
        return NextResponse.json({ error: 'Failed to fetch submission data' }, { status: 500 });
    }
}
