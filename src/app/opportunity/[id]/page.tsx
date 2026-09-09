import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OpportunityDetail from "./OpportunityDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const opp = await prisma.opportunity.findUnique({
    where: { id: params.id },
  });

  if (!opp) {
    return { title: "Tidak Ditemukan — Lomba & Beasiswa Finder" };
  }

  const emoji = opp.type === "BEASISWA" ? "🎓" : "🏆";
  const days = Math.ceil(
    (new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return {
    title: `${emoji} ${opp.title} — Lomba & Beasiswa Finder`,
    description: `${opp.title} oleh ${opp.organizer}. Deadline ${new Date(
      opp.deadline
    ).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} (${
      days < 0 ? "sudah lewat" : days === 0 ? "hari ini!" : `${days} hari lagi`
    }). ${opp.description?.slice(0, 120) ?? ""}`,
  };
}

export default async function OpportunityPage({ params }: Props) {
  const opp = await prisma.opportunity.findUnique({
    where: { id: params.id },
  });

  if (!opp) notFound();

  // Related opportunities: same category or field, soonest deadline first
  const related = await prisma.opportunity.findMany({
    where: {
      id: { not: opp.id },
      deadline: { gte: new Date() },
      OR: [{ category: opp.category }, { field: opp.field }],
    },
    orderBy: { deadline: "asc" },
    take: 6,
  });

  // Serialize Date for the client component
  const serialized = {
    ...opp,
    deadline: opp.deadline.toISOString(),
    createdAt: opp.createdAt.toISOString(),
  };
  const serializedRelated = related.map((r) => ({
    ...r,
    deadline: r.deadline.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));

  return <OpportunityDetail opp={serialized} related={serializedRelated} />;
}