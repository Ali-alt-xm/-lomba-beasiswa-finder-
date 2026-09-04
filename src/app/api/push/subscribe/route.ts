import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PushSub {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sub: PushSub | undefined = body?.subscription;
    const opportunityIds: string[] = Array.isArray(body?.opportunityIds)
      ? body.opportunityIds.map((id: unknown) => String(id))
      : [];

    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: sub.endpoint },
    });

    if (existing) {
      await prisma.pushSubscription.update({
        where: { endpoint: sub.endpoint },
        data: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          opportunityIds: JSON.stringify(opportunityIds),
        },
      });
    } else {
      await prisma.pushSubscription.create({
        data: {
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          opportunityIds: JSON.stringify(opportunityIds),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push subscribe error:", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}