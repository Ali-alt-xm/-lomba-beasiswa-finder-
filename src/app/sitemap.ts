import type { MetadataRoute } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://beasiswa-finder-ali.netlify.app";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // Dynamic opportunity pages
  const opportunities = await prisma.opportunity.findMany({
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const dynamicPages: MetadataRoute.Sitemap = opportunities.map((opp) => ({
    url: `${baseUrl}/opportunity/${opp.id}`,
    lastModified: opp.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  await prisma.$disconnect();

  return [...staticPages, ...dynamicPages];
}
