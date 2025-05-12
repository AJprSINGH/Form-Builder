import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
export async function GET() {
    try {
        const publishedForms = await prisma.form.findMany({
            where: {
                published: true,
            },
            select: {
                id: true,
                name: true,
            },
        });
        
        return NextResponse.json(publishedForms);
    } catch (error) {
        console.error("Error fetching published forms:", error);
        return NextResponse.json({ error: 'Failed to fetch published forms' }, { status: 500 });
    }
}