import type { Lecture } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export const TEACHER_DEPARTMENTS = ["CS", "SE", "AI", "MS"] as const;
export const CLASS_DEPARTMENTS = ["BSCS", "BSSE", "BSAI", "MS"] as const;
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const SECTIONS = ["A", "B", "C"] as const;
export const ROOM_BLOCKS = ["CS", "SE", "AI", "MS"] as const;
export const ROOM_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const LECTURE_SLOTS = ["Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5"] as const;
export const LAB_SLOTS = ["Slot 1 + Slot 2", "Slot 2 + Slot 3", "Slot 4 + Slot 5"] as const;

export type LectureType = "Lecture" | "Lab";

export type ConflictFlags = {
  room: boolean;
  teacher: boolean;
  students: boolean;
  labSlot: boolean;
};

export type AlternativeSlot = {
  date: string;
  day: string;
  slot: string;
};

export type NewLectureForConflict = {
  type: LectureType;
  department: string;
  semester: number;
  section: string;
  date: string;
  slot: string;
  room: string;
  teacherId: number;
};

export const generateRoomName = (block: string, roomNumber: number, type: LectureType) =>
  type === "Lab" ? `${block}LAB-${roomNumber}` : `${block}-${roomNumber}`;

export const isIsoDateString = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const getDayFromDate = (dateString: string): string | null => {
  if (!isIsoDateString(dateString)) return null;

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const dayIndex = date.getUTCDay();
  if (dayIndex === 0 || dayIndex === 6) return null;

  return DAYS[dayIndex - 1];
};

export const isAllowedSlot = (type: LectureType, slot: string) =>
  type === "Lab"
    ? (LAB_SLOTS as readonly string[]).includes(slot)
    : (LECTURE_SLOTS as readonly string[]).includes(slot);

export const validSlotsForType = (type: LectureType) =>
  type === "Lab" ? [...LAB_SLOTS] : [...LECTURE_SLOTS];

export const emptyConflictFlags = (): ConflictFlags => ({
  room: false,
  teacher: false,
  students: false,
  labSlot: false,
});

const hasAnyConflict = (conflicts: ConflictFlags) => Object.values(conflicts).some(Boolean);

export const conflictMessage = (conflicts: ConflictFlags) => {
  const parts: string[] = [];
  if (conflicts.room) parts.push("Room already booked.");
  if (conflicts.teacher) parts.push("Teacher already has a lecture.");
  if (conflicts.students) parts.push("Student group already has a lecture.");
  if (conflicts.labSlot) parts.push("Lab must use Slot 1 + Slot 2, Slot 2 + Slot 3, or Slot 4 + Slot 5.");
  return parts.join(" ");
};

export const detectConflictsFromLectures = (
  candidate: NewLectureForConflict,
  sameDateSlotLectures: Pick<
    Lecture,
    "room" | "teacherId" | "department" | "semester" | "section"
  >[],
) => {
  const conflicts = emptyConflictFlags();

  if (candidate.type === "Lab" && !isAllowedSlot(candidate.type, candidate.slot)) {
    conflicts.labSlot = true;
  }

  for (const lecture of sameDateSlotLectures) {
    if (lecture.room === candidate.room) conflicts.room = true;
    if (lecture.teacherId === candidate.teacherId) conflicts.teacher = true;
    if (
      lecture.department === candidate.department &&
      lecture.semester === candidate.semester &&
      lecture.section === candidate.section
    ) {
      conflicts.students = true;
    }
  }

  return {
    hasConflict: hasAnyConflict(conflicts),
    conflicts,
  };
};

export const checkLectureConflicts = async (candidate: NewLectureForConflict) => {
  const sameDateSlotLectures = await prisma.lecture.findMany({
    where: {
      date: candidate.date,
      slot: candidate.slot,
      status: "scheduled",
    },
    select: {
      room: true,
      teacherId: true,
      department: true,
      semester: true,
      section: true,
    },
  });

  return detectConflictsFromLectures(candidate, sameDateSlotLectures);
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

export const findAlternatives = async (candidate: NewLectureForConflict): Promise<AlternativeSlot[]> => {
  const validSlots = validSlotsForType(candidate.type);
  const start = new Date(`${candidate.date}T00:00:00.000Z`);
  const dates: string[] = [];

  for (let offset = 1; offset <= 14; offset += 1) {
    const dateString = toDateString(addDays(start, offset));
    if (getDayFromDate(dateString)) dates.push(dateString);
  }

  const lectures = await prisma.lecture.findMany({
    where: {
      date: { in: dates },
      slot: { in: validSlots },
      status: "scheduled",
    },
    select: {
      date: true,
      slot: true,
      room: true,
      teacherId: true,
      department: true,
      semester: true,
      section: true,
    },
  });

  const alternatives: AlternativeSlot[] = [];

  for (const date of dates) {
    const day = getDayFromDate(date);
    if (!day) continue;

    for (const slot of validSlots) {
      const sameDateSlotLectures = lectures.filter((lecture) => lecture.date === date && lecture.slot === slot);
      const { hasConflict } = detectConflictsFromLectures(
        { ...candidate, date, slot },
        sameDateSlotLectures,
      );

      if (!hasConflict) {
        alternatives.push({ date, day, slot });
        if (alternatives.length === 3) return alternatives;
      }
    }
  }

  return alternatives;
};
