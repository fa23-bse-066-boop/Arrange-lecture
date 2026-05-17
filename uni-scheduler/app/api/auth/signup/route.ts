import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { TEACHER_DEPARTMENTS } from "@/lib/conflicts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Partial<{
    name: string;
    email: string;
    password: string;
    department: string;
  }>;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  const department = typeof data.department === "string" ? data.department.trim().toUpperCase() : "";

  if (!name || !email || !password || !department) {
    return NextResponse.json({ error: "name, email, password, and department are required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (!(TEACHER_DEPARTMENTS as readonly string[]).includes(department)) {
    return NextResponse.json({ error: "Department must be CS, SE, AI, or MS." }, { status: 400 });
  }

  const existingTeacher = await prisma.teacher.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingTeacher) {
    return NextResponse.json({ error: "A teacher with this email already exists." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const teacher = await prisma.teacher.create({
    data: {
      name,
      email,
      password: hashedPassword,
      department,
    },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
    },
  });

  return NextResponse.json(teacher, { status: 201 });
}
