import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Context = {
  params: { id: string };
};

export async function GET(
  _request: NextRequest,
  context: Context
) {
  try {
    const { id } = context.params;
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Failed to fetch opportunity:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunity" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: Context
) {
  try {
    const { id } = context.params;
    const body = await request.json();
    const { title, type, category, description, organizer, deadline, location, eligibility, sourceUrl, imageUrl } = body;

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(type && { type }),
        ...(category && { category }),
        ...(description && { description }),
        ...(organizer && { organizer }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(location && { location }),
        ...(eligibility && { eligibility }),
        ...(sourceUrl && { sourceUrl }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      },
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Failed to update opportunity:", error);
    return NextResponse.json(
      { error: "Failed to update opportunity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: Context
) {
  try {
    const { id } = context.params;
    await prisma.opportunity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete opportunity:", error);
    return NextResponse.json(
      { error: "Failed to delete opportunity" },
      { status: 500 }
    );
  }
}
