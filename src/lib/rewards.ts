import { prisma } from "@/lib/db";

export interface InstructorTierInfo {
  rank: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  rankName: string;
  commissionPercent: number;
  adminSharePercent: number;
  totalStudents: number;
  nextRankThreshold: number | null;
  badgeColor: string;
}

/**
 * Calculates the dynamic rank and revenue commission rate for an instructor
 * based on their total student enrollments.
 */
export async function getInstructorRankAndCommission(
  instructorId: string
): Promise<InstructorTierInfo> {
  const courses = await prisma.course.findMany({
    where: { creatorId: instructorId },
    select: { id: true },
  });

  const courseIds = courses.map((c) => c.id);

  let totalStudents = 0;
  if (courseIds.length > 0) {
    totalStudents = await prisma.enrollment.count({
      where: { courseId: { in: courseIds } },
    });
  }

  // Tiers threshold logic:
  // Bronze: < 10 students (70% commission)
  // Silver: >= 10 students (75% commission)
  // Gold: >= 50 students (80% commission)
  // Platinum: >= 200 students (85% commission)
  let rank: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" = "BRONZE";
  let rankName = "Đồng (Bronze)";
  let commissionPercent = 70;
  let nextRankThreshold: number | null = 10;
  let badgeColor = "bg-amber-600/10 text-amber-800 border-amber-250";

  if (totalStudents >= 200) {
    rank = "PLATINUM";
    rankName = "Bạch Kim (Platinum)";
    commissionPercent = 85;
    nextRankThreshold = null;
    badgeColor = "bg-teal-500/10 text-teal-800 border-teal-200";
  } else if (totalStudents >= 50) {
    rank = "GOLD";
    rankName = "Vàng (Gold)";
    commissionPercent = 80;
    nextRankThreshold = 200;
    badgeColor = "bg-amber-400/10 text-amber-700 border-amber-200";
  } else if (totalStudents >= 10) {
    rank = "SILVER";
    rankName = "Bạc (Silver)";
    commissionPercent = 75;
    nextRankThreshold = 50;
    badgeColor = "bg-slate-300 text-slate-700 border-slate-400";
  }

  return {
    rank,
    rankName,
    commissionPercent,
    adminSharePercent: 100 - commissionPercent,
    totalStudents,
    nextRankThreshold,
    badgeColor,
  };
}

/**
 * Utility to award reward points to a student
 */
export async function awardPoints(userId: string, amount: number) {
  if (amount <= 0) return null;

  return await prisma.user.update({
    where: { id: userId },
    data: {
      points: { increment: amount },
      pointsEarned: { increment: amount },
    },
    select: { points: true, pointsEarned: true },
  });
}

/**
 * Converts reward points to Credit Balance (100 points = 10 credits)
 */
export async function redeemPointsToCredits(userId: string, pointsToRedeem: number) {
  if (pointsToRedeem < 100) {
    throw new Error("Số điểm tối thiểu để đổi là 100 điểm.");
  }
  if (pointsToRedeem % 100 !== 0) {
    throw new Error("Số điểm đổi phải là bội số của 100.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  if (!user || user.points < pointsToRedeem) {
    throw new Error("Không đủ điểm thưởng để thực hiện quy đổi.");
  }

  const creditsToAward = Math.floor(pointsToRedeem / 10);

  return await prisma.$transaction(async (tx) => {
    // 1. Deduct points from user
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { points: { decrement: pointsToRedeem } },
      select: { points: true, name: true },
    });

    // 2. Fetch or create credit wallet
    let wallet = await tx.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await tx.creditWallet.create({
        data: { userId, balance: 0 },
      });
    }

    // 3. Increment credit wallet balance
    const updatedWallet = await tx.creditWallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: creditsToAward } },
    });

    // 4. Create top-up transaction history record
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount: creditsToAward,
        type: "TOPUP",
        description: `Quy đổi ${pointsToRedeem} điểm thưởng thành credit`,
      },
    });

    return {
      points: updatedUser.points,
      balance: updatedWallet.balance,
      creditsAwarded: creditsToAward,
    };
  });
}
