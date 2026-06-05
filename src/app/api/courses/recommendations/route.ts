import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPersonalizedRecommendations } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const interestsCookieValue = req.cookies.get("user_interests")?.value;
    
    const recommendations = await getPersonalizedRecommendations(
      session?.user?.id,
      interestsCookieValue
    );
    
    // Limit to top 6 recommended courses for general app consumption
    return NextResponse.json(recommendations.slice(0, 6));
  } catch (error) {
    console.error("[Recommendations API] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
