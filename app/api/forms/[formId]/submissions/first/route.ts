import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma'; // adjust if your path is different

export async function GET(request: Request, { params }: { params: { formId: string } }) {
    const formId = parseInt(params.formId, 10);

    if (isNaN(formId)) {
        return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    try {
        const submission = await prisma.formSubmissions.findFirst({
            where: {
                formId: formId,
            },
            orderBy: {
                createdAt: 'desc', // or 'asc' to get the earliest one
            },
            select: {
                content: true, // assuming 'values' is JSON
            },
        });

        if (!submission) {
            return NextResponse.json({}, { status: 200 }); // No submission yet
        }
        console.log("Submission content:", submission.content); // Log the content for debugging
        const data=JSON.parse(submission.content);
        console.log("Parsed submission content:", data); 

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching form submission:", error);
        return NextResponse.json({ error: 'Failed to fetch submission data' }, { status: 500 });
    }
}
