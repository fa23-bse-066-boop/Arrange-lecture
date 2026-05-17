import type { DefaultSession } from "next-auth";
import type {} from "next-auth/jwt";

export type TeacherDepartment = "CS" | "SE" | "AI" | "MS";
export type ClassDepartment = "BSCS" | "BSSE" | "BSAI" | "MS";
export type LectureType = "Lecture" | "Lab";
export type Section = "A" | "B" | "C";
export type LectureStatus = "scheduled" | "cancelled";

export type PublicTeacher = {
  id: number;
  name: string;
  email: string;
  department: TeacherDepartment;
};

export type PublicLecture = {
  id: number;
  subject: string;
  type: LectureType;
  department: ClassDepartment;
  semester: number;
  section: Section;
  day: string;
  date: string;
  slot: string;
  room: string;
  status: LectureStatus;
  teacher: {
    name: string;
  };
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      department: string;
    } & DefaultSession["user"];
  }

  interface User {
    department: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    department?: string;
  }
}
