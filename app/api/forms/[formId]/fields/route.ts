import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma'; // Adjust the import path if necessary

export async function GET(request: Request, { params }: { params: { formId: string } }) {
    const formId = parseInt(params.formId, 10);

    if (isNaN(formId)) {
        return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    try {
        const form = await prisma.form.findUnique({
            where: {
                id: formId,
            },
            select: {
                content: true,
            },
        });

        if (!form) {
            return NextResponse.json({ error: 'Form not found' }, { status: 404 });
        }

        // Assuming content is a JSON string of form fields
        const formFields = JSON.parse(form.content);

        // You might want to add a check here to ensure formFields is an array
        if (!Array.isArray(formFields)) {
            console.error(`Form content for ID ${formId} is not a valid array:`, form.content);
            return NextResponse.json({ error: 'Invalid form content' }, { status: 500 });
        }

        // Further validation of individual field objects could be added here

        return NextResponse.json(formFields);
    } catch (error) {
        console.error("Error fetching form fields:", error);
        return NextResponse.json({ error: 'Failed to fetch form fields' }, { status: 500 });
    }
}