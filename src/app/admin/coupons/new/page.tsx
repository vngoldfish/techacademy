import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CouponForm } from "@/components/admin/CouponForm";

export const dynamic = "force-dynamic";

export default async function NewCouponPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    redirect("/signin");
  }

  // Fetch courses that this user can apply coupons to
  let courses = [];
  if (user.role === "ADMIN") {
    // Admins can create coupons for all courses
    courses = await prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  } else {
    // Instructors can only create coupons for their own courses
    courses = await prisma.course.findMany({
      where: { creatorId: user.id },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  }

  return (
    <div className="py-6">
      <CouponForm courses={courses} userRole={user.role} />
    </div>
  );
}
