import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getRedirectUrl(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  
  if (host) {
    return `${protocol}://${host}/admin/users`;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  return new URL("/admin/users", baseUrl).toString();
}

export async function POST(req: Request) {
  const redirectUrl = getRedirectUrl(req);
  const cookieStore = await cookies();
  cookieStore.delete("impersonate_user_id");
  cookieStore.delete("impersonate_user_data");
  return NextResponse.json({ success: true, redirectUrl });
}

export async function GET(req: Request) {
  const redirectUrl = getRedirectUrl(req);
  const cookieStore = await cookies();
  cookieStore.delete("impersonate_user_id");
  cookieStore.delete("impersonate_user_data");
  return NextResponse.redirect(redirectUrl);
}
