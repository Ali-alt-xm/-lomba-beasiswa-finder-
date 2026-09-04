import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { pushEnabled, wibDateStr, parseJson } from "@/lib/push";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function daysLeft(deadline: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  return Math.ceil((dl.getTime() - now.getTime()) / 86_400_000);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface AlarmCfg {
  daysBefore?: number;
  earlyBird?: boolean;
  earlyBirdDays?: number;
  checklistItems?: string[];
  teamTip?: string;
}

function triggerDaysFor(opp: {
  alarmType: string;
  alarmConfig: string | null;
}): { trigger: number; stage: string } {
  const cfg = parseJson<AlarmCfg | null>(opp.alarmConfig, null);
  const type = opp.alarmType || "standard";

  if (type === "elite-cup" && cfg?.earlyBird && cfg.earlyBirdDays) {
    return { trigger: cfg.earlyBirdDays, stage: "early" };
  }
  if (type === "sidanira") return { trigger: cfg?.daysBefore ?? 14, stage: "sidanira" };
  if (type === "team-league") return { trigger: cfg?.daysBefore ?? 7, stage: "team" };
  return { trigger: cfg?.daysBefore ?? 3, stage: "standard" };
}

function buildMessage(
  opp: { title: string; sourceUrl: string; deadline: Date; alarmConfig: string | null },
  days: number,
  stage: string
): { title: string; body: string; url: string } {
  const cfg = parseJson<AlarmCfg | null>(opp.alarmConfig, null);
  const dateStr = formatDate(opp.deadline);
  let body = `${dateStr} — ${days === 0 ? "deadline hari ini!" : `${days} hari lagi`}`;

  if (stage === "sidanira") {
    const tip =
      cfg?.checklistItems?.[0] ||
      "Jangan lupa minta surat rekomendasi resmi sekolah ke kepala sekolah.";
    body += `\n🚨 ${tip}`;
  } else if (stage === "team") {
    const tip =
      cfg?.teamTip ||
      "Bagikan link ini ke pelatih untuk daftarkan tim sekolahmu sebelum kuota penuh.";
    body += `\n⚡ ${tip}`;
  } else if (stage === "early") {
    body += `\n🔥 Kuota terbatas — daftar sekarang sebelum slot penuh!`;
  } else {
    const tip = cfg?.checklistItems?.[0];
    if (tip) body += `\n💡 ${tip}`;
  }

  const title = `⏰ ${opp.title.length > 40 ? opp.title.slice(0, 40) + "…" : opp.title}`;
  return { title, body, url: opp.sourceUrl || "/" };
}

async function handle(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!pushEnabled()) {
    return NextResponse.json({ error: "Push not configured" }, { status: 500 });
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { opportunityIds: { not: "[]" } },
  });

  const today = wibDateStr();
  let sent = 0;
  let removed = 0;

  for (const sub of subs) {
    const ids = parseJson<string[]>(sub.opportunityIds, []);
    if (!ids.length) continue;

    const opps = await prisma.opportunity.findMany({
      where: { id: { in: ids }, deadline: { gt: new Date() } },
    });
    if (!opps.length) continue;

    const notified = parseJson<Record<string, string>>(sub.notified, {});
    let changed = false;
    let deadSub = false;

    for (const opp of opps) {
      const days = daysLeft(opp.deadline);
      if (days < 0) continue;

      const { trigger, stage } = triggerDaysFor(opp);
      if (days > trigger) continue;
      if (notified[opp.id] === today) continue;

      const msg = buildMessage(opp, days, stage);
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(msg)
        );
        notified[opp.id] = today;
        changed = true;
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription expired/removed on the push service — clean it up.
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
          deadSub = true;
          removed++;
          break;
        }
        console.error(
          "push failed for",
          sub.endpoint.slice(0, 60),
          (err as Error)?.message
        );
      }
    }

    if (changed && !deadSub) {
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { notified: JSON.stringify(notified) },
      });
    }
  }

  return NextResponse.json(
    { ok: true, sent, removed },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}