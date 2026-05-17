import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  checkLectureConflicts,
  CLASS_DEPARTMENTS,
  conflictMessage,
  emptyConflictFlags,
  findAlternatives,
  generateRoomName,
  getDayFromDate,
  isAllowedSlot,
  ROOM_BLOCKS,
  ROOM_NUMBERS,
  SECTIONS,
  SEMESTERS,
  type LectureType,
} from "@/lib/conflicts";

export const runtime = "nodejs";

const lectureSelect = {
  id: true,
  subject: true,
  type: true,
  department: true,
  semester: true,
  section: true,
  day: true,
  date: true,
  slot: true,
  room: true,
  status: true,
  teacherId: true,
  teacher: {
    select: {
      name: true,
    },
  },
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const department = url.searchParams.get("department");
  const semesterParam = url.searchParams.get("semester");
  const section = url.searchParams.get("section");
  const semester = semesterParam ? Number(semesterParam) : undefined;

  const lectures = await prisma.lecture.findMany({
    where: {
      ...(department ? { department } : {}),
      ...(semester ? { semester } : {}),
      ...(section ? { section } : {}),
    },
    select: lectureSelect,
    orderBy: [{ date: "asc" }, { slot: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(lectures);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Partial<{
    subject: string;
    type: string;
    department: string;
    semester: number;
    section: string;
    date: string;
    slot: string;
    block: string;
    roomNumber: number | string;
  }>;

  const subject = typeof data.subject === "string" ? data.subject.trim() : "";
  const type = data.type === "Lab" ? "Lab" : data.type === "Lecture" ? "Lecture" : "";
  const department = typeof data.department === "string" ? data.department.trim().toUpperCase() : "";
  const semester = Number(data.semester);
  const section = typeof data.section === "string" ? data.section.trim().toUpperCase() : "";
  const date = typeof data.date === "string" ? data.date.trim() : "";
  const slot = typeof data.slot === "string" ? data.slot.trim() : "";
  const block = typeof data.block === "string" ? data.block.trim().toUpperCase() : "";
  const roomNumber = Number(data.roomNumber);

  if (!subject) {
    return NextResponse.json({ error: "Subject is required." }, { status: 400 });
  }

  if (!type) {
    return NextResponse.json({ error: 'Type must be "Lecture" or "Lab".' }, { status: 400 });
  }

  if (!(CLASS_DEPARTMENTS as readonly string[]).includes(department)) {
    return NextResponse.json({ error: "Department must be BSCS, BSSE, BSAI, or MS." }, { status: 400 });
  }

  if (!(SEMESTERS as readonly number[]).includes(semester)) {
    return NextResponse.json({ error: "Semester must be a number from 1 to 8." }, { status: 400 });
  }

  if (!(SECTIONS as readonly string[]).includes(section)) {
    return NextResponse.json({ error: "Section must be A, B, or C." }, { status: 400 });
  }

  const day = getDayFromDate(date);
  if (!day) {
    return NextResponse.json({ error: "Date must be a valid weekday ISO date string from Monday to Friday." }, { status: 400 });
  }

  if (!(ROOM_BLOCKS as readonly string[]).includes(block)) {
    return NextResponse.json({ error: "Block must be CS, SE, AI, or MS." }, { status: 400 });
  }

  if (!(ROOM_NUMBERS as readonly number[]).includes(roomNumber)) {
    return NextResponse.json({ error: "Room number must be from 1 to 10." }, { status: 400 });
  }

  const teacherId = Number(session.user.id);
  if (!Number.isInteger(teacherId)) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const room = generateRoomName(block, roomNumber, type as LectureType);
  const candidate = {
    type: type as LectureType,
    department,
    semester,
    section,
    date,
    slot,
    room,
    teacherId,
  };

  if (!isAllowedSlot(candidate.type, slot)) {
    const conflicts = { ...emptyConflictFlags(), labSlot: true };
    const alternatives = await findAlternatives(candidate);
    return NextResponse.json(
      {
        error: conflictMessage(conflicts),
        conflicts,
        alternatives,
      },
      { status: 409 },
    );
  }

  const conflictResult = await checkLectureConflicts(candidate);

  if (conflictResult.hasConflict) {
    const alternatives = await findAlternatives(candidate);
    return NextResponse.json(
      {
        error: conflictMessage(conflictResult.conflicts),
        conflicts: conflictResult.conflicts,
        alternatives,
      },
      { status: 409 },
    );
  }

  const lecture = await prisma.lecture.create({
    data: {
      subject,
      type,
      department,
      semester,
      section,
      date,
      day,
      slot,
      room,
      teacherId,
    },
    select: lectureSelect,
  });

  return NextResponse.json(lecture, { status: 201 });
}
