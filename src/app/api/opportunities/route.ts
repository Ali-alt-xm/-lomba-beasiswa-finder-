import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Only serve entries that haven't expired yet. Expired entries linger in
    // the DB for a 30-day grace period (purged by the scraper's cleanup),
    // but users should never see them.
    const opportunities = await prisma.opportunity.findMany({
      where: { deadline: { gte: new Date() } },
      orderBy: { deadline: "asc" },
    });
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, category, description, organizer, deadline, location, eligibility, sourceUrl, imageUrl } = body;

    if (!title || !type || !category || !description || !organizer || !deadline || !location || !eligibility || !sourceUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        title,
        type,
        category,
        description,
        organizer,
        deadline: new Date(deadline),
        location,
        eligibility,
        sourceUrl,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error("Failed to create opportunity:", error);
    return NextResponse.json(
      { error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}
