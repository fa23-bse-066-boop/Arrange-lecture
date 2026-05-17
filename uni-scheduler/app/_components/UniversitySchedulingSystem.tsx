"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  Users,
  X,
} from "lucide-react";
import type { PublicLecture, PublicTeacher } from "@/types";

type Lecture = PublicLecture & {
  teacherId?: number;
};

type Alternative = {
  date: string;
  day: string;
  slot: string;
};

type Message = {
  type: "success" | "error" | "";
  text: string;
};

const CLASS_DEPARTMENTS = ["BSCS", "BSSE", "BSAI", "MS"] as const;
const TEACHER_DEPARTMENTS = ["CS", "SE", "AI", "MS"] as const;
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const SECTIONS = ["A", "B", "C"] as const;
const ROOM_BLOCKS = ["CS", "SE", "AI", "MS"] as const;
const ROOM_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const LECTURE_SLOTS = ["Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5"] as const;
const LAB_SLOTS = ["Slot 1 + Slot 2", "Slot 2 + Slot 3", "Slot 4 + Slot 5"] as const;

const DEMO_TEACHERS = [
  { name: "Dr. Ahmed Khan", email: "ahmed@university.edu" },
  { name: "Dr. Fatima Malik", email: "fatima@university.edu" },
  { name: "Prof. Ali Raza", email: "ali@university.edu" },
];

const slotTime = (slot: string) => {
  const map: Record<string, string> = {
    "Slot 1": "8:30 - 10:00",
    "Slot 2": "10:00 - 11:30",
    "Slot 3": "11:30 - 1:00",
    "Slot 4": "1:30 - 3:00",
    "Slot 5": "3:00 - 4:30",
    "Slot 1 + Slot 2": "8:30 - 11:30",
    "Slot 2 + Slot 3": "10:00 - 1:00",
    "Slot 4 + Slot 5": "1:30 - 4:30",
  };
  return map[slot] ?? slot;
};

const generateRoomName = (block: string, number: string | number, type: string) =>
  type === "Lab" ? `${block}LAB-${number}` : `${block}-${number}`;

const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const apiError = async (response: Response) => {
  const data = await response.json().catch(() => null);
  return data?.error || "Something went wrong.";
};

const Select = ({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 pr-9 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
    >
      {children}
    </select>
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">v</span>
  </div>
);

const ButtonSpinner = () => <Loader2 className="h-4 w-4 animate-spin" />;

export default function UniversitySchedulingSystem() {
  const { data: session, status } = useSession();
  const [currentPage, setCurrentPage] = useState<"landing" | "login" | "dashboard" | "student">("landing");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [isLecturesLoading, setIsLecturesLoading] = useState(false);
  const [isTeachersLoading, setIsTeachersLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const fetchLectures = useCallback(async (filters?: { department?: string; semester?: number; section?: string }) => {
    setIsLecturesLoading(true);
    setPageError("");
    const params = new URLSearchParams();
    if (filters?.department) params.set("department", filters.department);
    if (filters?.semester) params.set("semester", String(filters.semester));
    if (filters?.section) params.set("section", filters.section);

    try {
      const response = await fetch(`/api/lectures${params.size ? `?${params}` : ""}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error(await apiError(response));
      setLectures(await response.json());
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load lectures.");
    } finally {
      setIsLecturesLoading(false);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    if (status !== "authenticated") return;
    setIsTeachersLoading(true);

    try {
      const response = await fetch("/api/teachers", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error(await apiError(response));
      setTeachers(await response.json());
    } catch {
      setTeachers([]);
    } finally {
      setIsTeachersLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTeachers();
      if (currentPage === "login") setCurrentPage("dashboard");
    }
  }, [currentPage, fetchTeachers, status]);

  const nav = (page: typeof currentPage) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
  };

  const authTeacher = session?.user;

  return (
    <div className={`min-h-screen font-sans transition ${isDark ? "bg-[#0b0f1a] text-white" : "bg-slate-100 text-slate-950"}`}>
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <button onClick={() => nav("landing")} className="flex items-center gap-2 text-left font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <BookOpen className="h-5 w-5 text-white" />
            </span>
            <span>Uni Scheduler</span>
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <button onClick={() => nav("student")} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Student View</button>
            {authTeacher ? (
              <>
                <button onClick={() => nav("dashboard")} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Dashboard</button>
                <div className="px-3 text-right">
                  <p className="text-sm font-semibold">{authTeacher.name}</p>
                  <p className="text-xs text-slate-500">{authTeacher.department} Department</p>
                </div>
                <button
                  onClick={() => {
                    signOut({ redirect: false });
                    nav("landing");
                  }}
                  className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button onClick={() => nav("login")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Teacher Login</button>
            )}
            <button onClick={() => setIsDark((value) => !value)} className="rounded-lg border border-white/10 p-2 text-slate-300">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <button onClick={() => setIsMenuOpen((value) => !value)} className="rounded-lg p-2 md:hidden">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-white/10 px-4 py-3 md:hidden">
            <button onClick={() => nav("student")} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300">Student View</button>
            {authTeacher ? (
              <>
                <button onClick={() => nav("dashboard")} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300">Dashboard</button>
                <button
                  onClick={() => {
                    signOut({ redirect: false });
                    nav("landing");
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button onClick={() => nav("login")} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-blue-300">Teacher Login</button>
            )}
          </div>
        )}
      </nav>

      {pageError && (
        <div className="mx-auto mt-4 flex max-w-6xl items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {pageError}
        </div>
      )}

      {currentPage === "landing" && (
        <LandingPage
          isLoading={isLecturesLoading}
          lectureCount={lectures.length}
          teacherCount={teachers.length}
          authStatus={status}
          onStudent={() => nav("student")}
          onLogin={() => nav(authTeacher ? "dashboard" : "login")}
        />
      )}

      {currentPage === "login" && !authTeacher && <LoginPage onSignedIn={() => nav("dashboard")} />}

      {currentPage === "dashboard" && authTeacher && (
        <TeacherDashboard
          lectures={lectures}
          sessionUserId={Number(authTeacher.id)}
          sessionName={authTeacher.name ?? "Teacher"}
          isLecturesLoading={isLecturesLoading}
          isTeachersLoading={isTeachersLoading}
          teachers={teachers}
          refreshLectures={() => fetchLectures()}
        />
      )}

      {currentPage === "student" && (
        <StudentView lectures={lectures} isLoading={isLecturesLoading} fetchLectures={fetchLectures} />
      )}
    </div>
  );
}

function LandingPage({
  isLoading,
  lectureCount,
  teacherCount,
  authStatus,
  onStudent,
  onLogin,
}: {
  isLoading: boolean;
  lectureCount: number;
  teacherCount: number;
  authStatus: string;
  onStudent: () => void;
  onLogin: () => void;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-300">Makeup lectures and room allocation</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">University Scheduling System</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            Arrange makeup lectures, protect teachers and student groups from clashes, and publish a searchable schedule for students.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={onLogin} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">Teacher Portal</button>
            <button onClick={onStudent} className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5">View Student Schedule</button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-5 text-lg font-bold text-white">Live System Status</h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Metric icon={Calendar} label="Scheduled lectures" value={isLoading ? "..." : String(lectureCount)} />
            <Metric icon={Users} label="Known teachers" value={authStatus === "authenticated" ? String(teacherCount) : "Login required"} />
            <Metric icon={Building2} label="Room source" value="Runtime generated" />
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <Icon className="mb-3 h-5 w-5 text-blue-300" />
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function LoginPage({ onSignedIn }: { onSignedIn: () => void }) {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<Message>({ type: "", text: "" });
  const [login, setLogin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({ name: "", email: "", password: "", department: "CS" });

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    const result = await signIn("credentials", {
      email: login.email,
      password: login.password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setMessage({ type: "error", text: "Invalid email or password." });
      return;
    }

    onSignedIn();
  };

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(signup),
      });

      if (!response.ok) throw new Error(await apiError(response));

      const result = await signIn("credentials", {
        email: signup.email,
        password: signup.password,
        redirect: false,
      });

      if (result?.error) throw new Error("Account created, but automatic sign-in failed.");
      onSignedIn();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to create account." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-2xl font-bold text-white">{isSignup ? "Create Teacher Account" : "Teacher Login"}</h1>
        <p className="mt-1 text-sm text-slate-500">{isSignup ? "Register with your university department." : "Sign in to arrange makeup lectures."}</p>

        {message.text && (
          <div className={`mt-5 flex items-start gap-2 rounded-lg border p-3 text-sm ${message.type === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-green-500/30 bg-green-500/10 text-green-200"}`}>
            {message.type === "error" ? <AlertCircle className="mt-0.5 h-4 w-4" /> : <CheckCircle className="mt-0.5 h-4 w-4" />}
            {message.text}
          </div>
        )}

        <form onSubmit={isSignup ? handleSignup : handleLogin} className="mt-6 space-y-3">
          {isSignup && (
            <>
              <Input placeholder="Full name" value={signup.name} onChange={(value) => setSignup((current) => ({ ...current, name: value }))} />
              <Select value={signup.department} onChange={(value) => setSignup((current) => ({ ...current, department: value }))}>
                {TEACHER_DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </Select>
            </>
          )}

          <Input
            type="email"
            placeholder="Email address"
            value={isSignup ? signup.email : login.email}
            onChange={(value) => isSignup ? setSignup((current) => ({ ...current, email: value })) : setLogin((current) => ({ ...current, email: value }))}
          />
          <Input
            type="password"
            placeholder="Password"
            value={isSignup ? signup.password : login.password}
            onChange={(value) => isSignup ? setSignup((current) => ({ ...current, password: value })) : setLogin((current) => ({ ...current, password: value }))}
          />

          <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
            {isLoading && <ButtonSpinner />}
            {isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignup((value) => !value);
            setMessage({ type: "", text: "" });
          }}
          className="mt-5 w-full text-center text-sm text-blue-300 hover:text-blue-200"
        >
          {isSignup ? "Already have an account? Sign in" : "Need teacher access? Create an account"}
        </button>

        {!isSignup && (
          <div className="mt-6 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-400">
            <p className="mb-2 font-semibold text-slate-200">Demo credentials after seeding</p>
            {DEMO_TEACHERS.map((teacher) => (
              <button
                key={teacher.email}
                type="button"
                onClick={() => setLogin({ email: teacher.email, password: "pass123" })}
                className="block w-full rounded py-1 text-left hover:text-white"
              >
                {teacher.name} - {teacher.email}
              </button>
            ))}
            <p className="mt-2 text-slate-500">Password: pass123</p>
          </div>
        )}
      </div>
    </main>
  );
}

function TeacherDashboard({
  lectures,
  sessionUserId,
  sessionName,
  isLecturesLoading,
  isTeachersLoading,
  teachers,
  refreshLectures,
}: {
  lectures: Lecture[];
  sessionUserId: number;
  sessionName: string;
  isLecturesLoading: boolean;
  isTeachersLoading: boolean;
  teachers: PublicTeacher[];
  refreshLectures: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"arrange" | "schedule" | "rooms" | "teachers">("arrange");
  const [message, setMessage] = useState<Message>({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [form, setForm] = useState({
    subject: "",
    type: "Lecture",
    department: "BSCS",
    semester: 1,
    section: "A",
    date: "",
    slot: "Slot 1",
    block: "",
    roomNumber: "",
  });

  const derivedRoom = form.block && form.roomNumber ? generateRoomName(form.block, form.roomNumber, form.type) : "";
  const myLectures = lectures.filter((lecture) => lecture.teacherId === sessionUserId || lecture.teacher.name === sessionName);
  const roomNames = useMemo(() => Array.from(new Set(lectures.map((lecture) => lecture.room))).sort(), [lectures]);

  const update = (key: keyof typeof form, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleArrange = async (event: FormEvent) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setAlternatives([]);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/lectures", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      if (response.status === 409) {
        const data = await response.json();
        setAlternatives(data.alternatives ?? []);
        throw new Error(data.error || "Schedule conflict.");
      }

      if (!response.ok) throw new Error(await apiError(response));

      await refreshLectures();
      setForm({
        subject: "",
        type: "Lecture",
        department: "BSCS",
        semester: 1,
        section: "A",
        date: "",
        slot: "Slot 1",
        block: "",
        roomNumber: "",
      });
      setMessage({ type: "success", text: "Lecture scheduled successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to schedule lecture." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`/api/lectures/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error(await apiError(response));
      await refreshLectures();
      setMessage({ type: "success", text: "Lecture deleted successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to delete lecture." });
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Teacher Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Arrange makeup lectures and manage your schedule.</p>
        </div>
        {(isLecturesLoading || isTeachersLoading) && <span className="flex items-center gap-2 text-sm text-slate-400"><ButtonSpinner /> Syncing data</span>}
      </div>

      {message.text && (
        <div className={`mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm ${message.type === "success" ? "border-green-500/30 bg-green-500/10 text-green-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>
          {message.type === "success" ? <CheckCircle className="mt-0.5 h-5 w-5" /> : <AlertCircle className="mt-0.5 h-5 w-5" />}
          {message.text}
        </div>
      )}

      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-white/10">
        {[
          { key: "arrange", label: "Arrange", icon: Plus },
          { key: "schedule", label: "My Schedule", icon: Calendar },
          { key: "rooms", label: "Rooms", icon: Building2 },
          { key: "teachers", label: "Teachers", icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold ${tab === key ? "border-b-2 border-blue-400 text-blue-300" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "arrange" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form onSubmit={handleArrange} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-5 text-xl font-bold text-white">Schedule Lecture</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Subject">
                <Input placeholder="Subject name" value={form.subject} onChange={(value) => update("subject", value)} />
              </Field>
              <Field label="Type">
                <Select
                  value={form.type}
                  onChange={(value) => {
                    update("type", value);
                    update("slot", value === "Lab" ? LAB_SLOTS[0] : LECTURE_SLOTS[0]);
                  }}
                >
                  <option value="Lecture">Lecture</option>
                  <option value="Lab">Lab</option>
                </Select>
              </Field>
              <Field label="Department">
                <Select value={form.department} onChange={(value) => update("department", value)}>
                  {CLASS_DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
                </Select>
              </Field>
              <Field label="Semester">
                <Select value={form.semester} onChange={(value) => update("semester", Number(value))}>
                  {SEMESTERS.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
                </Select>
              </Field>
              <Field label="Section">
                <Select value={form.section} onChange={(value) => update("section", value)}>
                  {SECTIONS.map((section) => <option key={section} value={section}>Section {section}</option>)}
                </Select>
              </Field>
              <Field label="Date">
                <Input type="date" value={form.date} onChange={(value) => update("date", value)} />
              </Field>
              <Field label="Slot">
                <Select value={form.slot} onChange={(value) => update("slot", value)}>
                  {(form.type === "Lab" ? LAB_SLOTS : LECTURE_SLOTS).map((slot) => <option key={slot} value={slot}>{slot} ({slotTime(slot)})</option>)}
                </Select>
              </Field>
              <Field label="Block">
                <Select value={form.block} onChange={(value) => update("block", value)}>
                  <option value="">Select block</option>
                  {ROOM_BLOCKS.map((block) => <option key={block} value={block}>{block}</option>)}
                </Select>
              </Field>
              <Field label="Room number">
                <Select value={form.roomNumber} onChange={(value) => update("roomNumber", value)}>
                  <option value="">Select room</option>
                  {ROOM_NUMBERS.map((roomNumber) => <option key={roomNumber} value={roomNumber}>{roomNumber}</option>)}
                </Select>
              </Field>
            </div>
            <button disabled={isSubmitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting && <ButtonSpinner />}
              Schedule Lecture
            </button>
          </form>

          <aside className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h3 className="mb-4 font-bold text-white">Preview</h3>
              <PreviewRow label="Teacher" value={sessionName} />
              <PreviewRow label="Subject" value={form.subject || "-"} />
              <PreviewRow label="Group" value={`${form.department} Semester ${form.semester} Section ${form.section}`} />
              <PreviewRow label="Slot" value={form.slot} />
              <PreviewRow label="Room" value={derivedRoom || "-"} />
            </div>

            {alternatives.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
                <h3 className="mb-3 font-bold text-amber-200">Suggested Alternatives</h3>
                <div className="space-y-2">
                  {alternatives.map((alternative) => (
                    <div key={`${alternative.date}-${alternative.slot}`} className="rounded-lg bg-slate-950/60 p-3 text-sm text-slate-300">
                      <p className="font-semibold text-white">{alternative.day}, {formatDate(alternative.date)}</p>
                      <p className="text-slate-500">{alternative.slot} ({slotTime(alternative.slot)})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {tab === "schedule" && (
        <LectureList lectures={myLectures} emptyText="No lectures arranged yet." onDelete={handleCancel} canDelete />
      )}

      {tab === "rooms" && (
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.04]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Booked lectures</th>
                <th className="px-4 py-3">Next booking</th>
              </tr>
            </thead>
            <tbody>
              {roomNames.map((room) => {
                const bookings = lectures.filter((lecture) => lecture.room === room);
                return (
                  <tr key={room} className="border-b border-white/5">
                    <td className="px-4 py-3 font-semibold text-white">{room}</td>
                    <td className="px-4 py-3 text-slate-300">{bookings.length}</td>
                    <td className="px-4 py-3 text-slate-400">{bookings[0] ? `${bookings[0].day}, ${bookings[0].slot}` : "Free"}</td>
                  </tr>
                );
              })}
              {roomNames.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-500">No room bookings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "teachers" && (
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.04]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Department</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-semibold text-white">{teacher.name}</td>
                  <td className="px-4 py-3 text-slate-300">{teacher.email}</td>
                  <td className="px-4 py-3 text-slate-400">{teacher.department}</td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-500">No teachers loaded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function StudentView({
  lectures,
  isLoading,
  fetchLectures,
}: {
  lectures: Lecture[];
  isLoading: boolean;
  fetchLectures: (filters?: { department?: string; semester?: number; section?: string }) => Promise<void>;
}) {
  const [filters, setFilters] = useState({ department: "BSCS", semester: 1, section: "A" });
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setSearched(true);
    await fetchLectures(filters);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Student Schedule</h1>
        <p className="mt-1 text-sm text-slate-500">Search makeup lectures for your class group.</p>
      </div>

      <div className="mb-8 rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Department">
            <Select value={filters.department} onChange={(value) => setFilters((current) => ({ ...current, department: value }))}>
              {CLASS_DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
            </Select>
          </Field>
          <Field label="Semester">
            <Select value={filters.semester} onChange={(value) => setFilters((current) => ({ ...current, semester: Number(value) }))}>
              {SEMESTERS.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
            </Select>
          </Field>
          <Field label="Section">
            <Select value={filters.section} onChange={(value) => setFilters((current) => ({ ...current, section: value }))}>
              {SECTIONS.map((section) => <option key={section} value={section}>Section {section}</option>)}
            </Select>
          </Field>
          <div className="flex items-end">
            <button onClick={handleSearch} disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-70">
              {isLoading ? <ButtonSpinner /> : <Search className="h-4 w-4" />}
              View Schedule
            </button>
          </div>
        </div>
      </div>

      {searched && <LectureList lectures={lectures} emptyText="No lectures found for this group." />}
    </main>
  );
}

function LectureList({
  lectures,
  emptyText,
  canDelete = false,
  onDelete,
}: {
  lectures: Lecture[];
  emptyText: string;
  canDelete?: boolean;
  onDelete?: (id: number) => void;
}) {
  if (lectures.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-12 text-center text-slate-500">
        <Clock className="mx-auto mb-3 h-10 w-10 opacity-40" />
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.04]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
            {["Subject", "Teacher", "Type", "Group", "Room", "Date", "Slot", "Status", canDelete ? "Action" : ""].filter(Boolean).map((heading) => (
              <th key={heading} className="px-4 py-3">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lectures.map((lecture) => (
            <tr key={lecture.id} className="border-b border-white/5">
              <td className="px-4 py-3 font-semibold text-white">{lecture.subject}</td>
              <td className="px-4 py-3 text-slate-300">{lecture.teacher.name}</td>
              <td className="px-4 py-3 text-slate-300">{lecture.type}</td>
              <td className="px-4 py-3 text-slate-400">{lecture.department} Sem {lecture.semester}-{lecture.section}</td>
              <td className="px-4 py-3 font-semibold text-slate-300">{lecture.room}</td>
              <td className="px-4 py-3 text-slate-400">{lecture.day}, {formatDate(lecture.date)}</td>
              <td className="px-4 py-3 text-slate-400">{lecture.slot}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-300">{lecture.status}</span>
              </td>
              {canDelete && (
                <td className="px-4 py-3">
                  <button onClick={() => onDelete?.(lecture.id)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10">
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
    />
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}
