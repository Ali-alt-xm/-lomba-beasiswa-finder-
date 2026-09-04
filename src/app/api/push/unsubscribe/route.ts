import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const endpoint = body?.endpoint;

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push unsubscribe error:", err);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}