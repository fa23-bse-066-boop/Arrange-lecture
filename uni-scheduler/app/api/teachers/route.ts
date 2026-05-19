import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: teachers, error } = await supabase
    .from("Teacher")
    .select("id, name, email, department")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch teachers." }, { status: 500 });
  }

  return NextResponse.json(teachers);
}
