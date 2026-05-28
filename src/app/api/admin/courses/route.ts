import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const courseSchema = z.object({
  title: z.string().min(1, "Tên không được trống"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang"),
  description: z.string().optional(),
  priceCredit: z.number().min(0, "Giá không được âm"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = courseSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.course.findUnique({ where: { slug: result.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
  }

  const course = await prisma.course.create({
    data: {
      ...result.data,
      description: result.data.description ?? null,
      creatorId: session.user.id,
    },
  });

  return NextResponse.json({ course }, { status: 201 });
}
