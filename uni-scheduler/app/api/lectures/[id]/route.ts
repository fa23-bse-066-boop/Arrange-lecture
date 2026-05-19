import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const id = Number(params.id);
  const teacherId = Number(session.user.id);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid lecture id." }, { status: 400 });
  }

  const { data: lecture, error } = await supabase
    .from("Lecture")
    .select("id, teacherId")
    .eq("id", id)
    .single();

  if (error || !lecture) {
    return NextResponse.json({ error: "Lecture not found." }, { status: 404 });
  }

  if (lecture.teacherId !== teacherId) {
    return NextResponse.json({ error: "You can only delete your own lectures." }, { status: 403 });
  }

  await supabase
    .from("Lecture")
    .delete()
    .eq("id", id);

  return NextResponse.json({ success: true });
}
