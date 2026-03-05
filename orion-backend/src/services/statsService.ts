import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export const statsService = {
  async getTodayStats(userId: string) {
    const date = todayDate();

    let stats = await prisma.browsingStats.findUnique({
      where: { date_userId: { date, userId } },
    });

    if (!stats) {
      stats = await prisma.browsingStats.create({
        data: { date, userId },
      });
    }

    return stats;
  },

  async incrementTrackers(userId: string, count: number = 1) {
    const date = todayDate();
    return prisma.browsingStats.upsert({
      where: { date_userId: { date, userId } },
      create: { date, userId, trackersBlocked: count },
      update: { trackersBlocked: { increment: count } },
    });
  },

  async recordSiteVisit(userId: string, domain: string, minutes: number) {
    const date = todayDate();
    return prisma.siteVisit.upsert({
      where: { domain_userId_date: { domain, userId, date } },
      create: { domain, userId, date, minutes },
      update: { minutes: { increment: minutes } },
    });
  },

  async getTopSites(userId: string, limit = 5) {
    const date = todayDate();
    return prisma.siteVisit.findMany({
      where: { userId, date },
      orderBy: { minutes: "desc" },
      take: limit,
    });
  },

  async getHourlyUsage(userId: string) {
    // This would typically come from a more granular table
    // For now return mock data structure the frontend expects
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      percentage: i < 7 ? 5 : i < 9 ? 40 : i < 12 ? 70 : i < 14 ? 50 : i < 18 ? 85 : i < 21 ? 60 : 30,
    }));
  },
};