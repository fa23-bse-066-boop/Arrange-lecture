import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Seed route is available in development only." }, { status: 403 });
  }

  return NextResponse.json({ success: true, message: "Seed API ready. Create teachers via POST /api/auth/signup" });
}
