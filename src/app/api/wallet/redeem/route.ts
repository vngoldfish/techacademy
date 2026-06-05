import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { redeemPointsToCredits } from "@/lib/rewards";
import { z } from "zod";

const redeemSchema = z.object({
  points: z.number().int().min(100, "Số điểm quy đổi tối thiểu là 100 điểm").refine(
    (val) => val % 100 === 0,
    "Số điểm quy đổi phải là bội số của 100"
  ),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = redeemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const redeemResult = await redeemPointsToCredits(
      session.user.id,
      result.data.points
    );

    return NextResponse.json({
      success: true,
      message: `Đổi thành công ${result.data.points} điểm thành ${redeemResult.creditsAwarded} Credit!`,
      points: redeemResult.points,
      balance: redeemResult.balance,
    });
  } catch (error: any) {
    console.error("[Redeem Points API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi khi quy đổi điểm thưởng." },
      { status: 400 }
    );
  }
}
