import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rateLimit";
import { isAuthorized } from "@/lib/adminAuth";

// Never prerender at build time: the build environment has no database access,
// and the list should reflect the DB at request time (CDN caching is handled by
// the Cache-Control header below).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Only serve entries that haven't expired yet. Expired entries linger in
    // the DB for a 30-day grace period (purged by the scraper's cleanup),
    // but users should never see them.
    const opportunities = await prisma.opportunity.findMany({
      where: { deadline: { gte: new Date() } },
      orderBy: { deadline: "asc" },
    });
    return NextResponse.json(opportunities, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(clientKey(request, "opp-write"), 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

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
