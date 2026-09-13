import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OpportunityDetail from "./OpportunityDetail";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beasiswa-finder-ali.netlify.app";

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
  const deadlineStr = new Date(opp.deadline).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const daysText =
    days < 0 ? "sudah lewat" : days === 0 ? "hari ini!" : `${days} hari lagi`;
  const desc = `${opp.title} oleh ${opp.organizer}. Deadline ${deadlineStr} (${daysText}). ${opp.description?.slice(0, 120) ?? ""}`;
  const pageTitle = `${emoji} ${opp.title}`;

  return {
    title: pageTitle,
    description: desc,
    alternates: {
      canonical: `${SITE_URL}/opportunity/${opp.id}`,
    },
    openGraph: {
      title: `${pageTitle} — Lomba & Beasiswa Finder`,
      description: desc,
      url: `${SITE_URL}/opportunity/${opp.id}`,
      siteName: "Lomba & Beasiswa Finder",
      locale: "id_ID",
      type: "article",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: opp.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageTitle} — Lomba & Beasiswa Finder`,
      description: desc,
      images: ["/og-image.png"],
    },
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

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": opp.type === "BEASISWA" ? "EducationalOccupationalCredential" : "Event",
    name: opp.title,
    description: opp.description,
    url: opp.sourceUrl,
    organizer: {
      "@type": "Organization",
      name: opp.organizer,
    },
    endDate: opp.deadline,
    location:
      opp.location === "ONLINE"
        ? { "@type": "VirtualLocation", url: opp.sourceUrl }
        : { "@type": "Place", name: opp.location },
    isAccessibleForFree: opp.isFree !== false,
    inLanguage: "id",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OpportunityDetail opp={serialized} related={serializedRelated} />
    </>
  );
}
