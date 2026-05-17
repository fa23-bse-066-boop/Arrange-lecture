import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, Plus, Calendar, Users, AlertCircle, CheckCircle, Clock, BookOpen, Building2, Hash, Eye, ChevronDown, Sun, Moon } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const SLOTS = [
  { id: 1, name: 'Slot 1', time: '8:30 – 10:00' },
  { id: 2, name: 'Slot 2', time: '10:00 – 11:30' },
  { id: 3, name: 'Slot 3', time: '11:30 – 1:00' },
  { id: 4, name: 'Slot 4', time: '1:30 – 3:00' },
  { id: 5, name: 'Slot 5', time: '3:00 – 4:30' },
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEPARTMENTS = ['BSCS', 'BSSE', 'BSAI', 'MS'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTIONS = ['A', 'B', 'C'];
const ROOM_BLOCKS = ['CS', 'SE', 'AI', 'MS'];
const ROOM_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const TEACHERS_DB = [
  { id: 1, name: 'Dr. Ahmed Khan', email: 'ahmed@university.edu', department: 'CS', password: 'pass123' },
  { id: 2, name: 'Dr. Fatima Malik', email: 'fatima@university.edu', department: 'SE', password: 'pass123' },
  { id: 3, name: 'Prof. Ali Raza', email: 'ali@university.edu', department: 'AI', password: 'pass123' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateRoomName = (block, number, type) =>
  type === 'Lab' ? `${block}LAB-${number}` : `${block}-${number}`;

const getDayFromDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1] ?? '';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

const getValidLabSlots = (slotName) => {
  const n = parseInt(slotName.replace('Slot ', ''));
  return [[1, 2], [2, 3], [4, 5]].some((c) => c.includes(n));
};

// ─── Styled Select ────────────────────────────────────────────────────────────
const Sel = ({ value, onChange, children, className = '' }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full appearance-none bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all cursor-pointer"
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);

// ─── Room Selector Widget ─────────────────────────────────────────────────────
const RoomSelector = ({ block, number, onBlockChange, onNumberChange, lectureType }) => {
  const preview = block && number ? generateRoomName(block, number, lectureType) : null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Block</label>
          <Sel value={block} onChange={(e) => onBlockChange(e.target.value)}>
            <option value="">Select Block</option>
            {ROOM_BLOCKS.map((b) => <option key={b} value={b}>{b}</option>)}
          </Sel>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Room No.</label>
          <Sel value={number} onChange={(e) => onNumberChange(e.target.value)}>
            <option value="">Select No.</option>
            {ROOM_NUMBERS.map((n) => <option key={n} value={n}>{n}</option>)}
          </Sel>
        </div>
      </div>
      {preview ? (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/40 rounded-xl">
          <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-sm text-slate-300">Selected Room: <strong className="text-blue-300 font-mono">{preview}</strong></span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/40 border border-slate-700 rounded-xl">
          <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-sm text-slate-500">Select block and room number above</span>
        </div>
      )}
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const UniversitySchedulingSystem = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authTeacher, setAuthTeacher] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [lectures, setLectures] = useState([
    {
      id: 1,
      subject: 'Data Structures',
      type: 'Lecture',
      department: 'BSCS',
      semester: 4,
      section: 'A',
      day: 'Monday',
      date: '2026-05-18',
      slot: 'Slot 1',
      room: 'SE-1',
      teacher: 'Dr. Ahmed Khan',
      status: 'scheduled',
      createdBy: 'Dr. Ahmed Khan',
    },
  ]);

  const checkConflicts = (newLec, excludeId = null) => {
    const conflicts = { room: false, teacher: false, students: false, labSlot: false };
    if (newLec.type === 'Lab' && !getValidLabSlots(newLec.slot)) {
      conflicts.labSlot = true;
      return { hasConflict: true, conflicts };
    }
    lectures.forEach((l) => {
      if (excludeId && l.id === excludeId) return;
      if (l.date === newLec.date && l.slot === newLec.slot) {
        if (l.room === newLec.room) conflicts.room = true;
        if (l.createdBy === newLec.createdBy) conflicts.teacher = true;
        if (l.department === newLec.department && l.semester === newLec.semester && l.section === newLec.section)
          conflicts.students = true;
      }
    });
    return { hasConflict: Object.values(conflicts).some(Boolean), conflicts };
  };

  const findAlternatives = (failedLec) => {
    const alts = [];
    const today = new Date();
    for (let i = 0; i < 14 && alts.length < 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const dateStr = d.toISOString().split('T')[0];
      SLOTS.forEach((s) => {
        if (alts.length >= 3) return;
        const test = { ...failedLec, date: dateStr, day: getDayFromDate(dateStr), slot: s.name };
        const { hasConflict } = checkConflicts(test);
        if (!hasConflict)
          alts.push({ date: dateStr, day: getDayFromDate(dateStr), slot: s.name, time: s.time });
      });
    }
    return alts;
  };

  const nav = (page) => { setCurrentPage(page); setIsMenuOpen(false); };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-[#0b0f1a] text-white' : 'light bg-[#f0f4f8] text-slate-900'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        /* ── Dark theme (default) ── */
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); }
        .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; }
        .badge-scheduled { background:#16a34a22; color:#4ade80; border:1px solid #16a34a55; }
        .badge-cancelled { background:#dc262622; color:#f87171; border:1px solid #dc262655; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor:pointer; }
        select option { background: #1e2535; }
        .tab-active { color:#60a5fa; border-bottom:2px solid #60a5fa; }
        .tab-inactive { color:#64748b; }
        .tab-inactive:hover { color:#94a3b8; }

        /* ── Light theme overrides ── */
        .light { background-color:#f0f4f8; color:#0f172a; }
        .light .glass { background:rgba(255,255,255,0.88) !important; border-color:rgba(0,0,0,0.08) !important; }
        .light .card { background:rgba(255,255,255,0.96) !important; border:1px solid rgba(0,0,0,0.09) !important; box-shadow:0 1px 4px rgba(0,0,0,0.07); }
        .light nav { background:rgba(255,255,255,0.88) !important; border-color:rgba(0,0,0,0.08) !important; }
        .light .tab-inactive { color:#94a3b8 !important; }
        .light .tab-inactive:hover { color:#475569 !important; }
        .light .tab-active { color:#2563eb !important; border-bottom-color:#2563eb !important; }
        .light [class*="bg-slate-800"] { background-color:#ffffff !important; }
        .light [class*="bg-slate-700"] { background-color:#f1f5f9 !important; }
        .light [class*="bg-black"] { background-color:rgba(255,255,255,0.88) !important; }
        .light [class*="text-slate-3"] { color:#334155 !important; }
        .light [class*="text-slate-4"] { color:#475569 !important; }
        .light [class*="text-slate-5"] { color:#64748b !important; }
        .light [class*="text-slate-6"] { color:#94a3b8 !important; }
        .light [class*="border-slate-7"] { border-color:#e2e8f0 !important; }
        .light [class*="border-slate-6"] { border-color:#cbd5e1 !important; }
        .light [class*="border-white"] { border-color:rgba(0,0,0,0.08) !important; }
        .light h1,.light h2,.light h3 { color:#0f172a !important; }
        .light p.font-semibold,.light p.font-bold { color:#0f172a !important; }
        .light select { background-color:#ffffff !important; color:#0f172a !important; border-color:#cbd5e1 !important; }
        .light select option { background:#ffffff !important; color:#0f172a !important; }
        .light input[type="text"],.light input[type="email"],.light input[type="password"],.light input[type="date"] {
          background-color:#ffffff !important; color:#0f172a !important; border-color:#cbd5e1 !important;
        }
        .light input::placeholder { color:#94a3b8 !important; }
        .light input[type=date]::-webkit-calendar-picker-indicator { filter:invert(0.3) !important; }
        .light .badge-scheduled { background:#dcfce7 !important; color:#15803d !important; border-color:#86efac !important; }
        .light .badge-cancelled { background:#fee2e2 !important; color:#dc2626 !important; border-color:#fca5a5 !important; }
        .light [class*="text-white"] { color:#0f172a !important; }
        .light .text-transparent { color:transparent !important; }
        .light button.text-white,.light button[class*="bg-blue"],.light button[class*="bg-red"],.light button[class*="bg-purple"] { color:#ffffff !important; }
        .light span[class*="text-green-"],.light span[class*="text-red-"],.light span[class*="text-blue-"],.light span[class*="text-purple-"],.light span[class*="text-amber-"] { }
      `}</style>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => { setCurrentPage('landing'); setAuthTeacher(null); }}
            className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">UniSchedule</span>
          </button>

          <div className="hidden md:flex items-center gap-2">
            {!authTeacher ? (
              <>
                <button onClick={() => nav('student')} className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5">
                  <Eye className="w-4 h-4" /> Student View
                </button>
                <button onClick={() => nav('login')} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition">
                  Teacher Login
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{authTeacher.name}</p>
                  <p className="text-xs text-slate-500">{authTeacher.department} Department</p>
                </div>
                <button onClick={() => { setAuthTeacher(null); nav('landing'); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/5 transition">
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Theme Toggle — always visible */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`p-2 rounded-lg transition flex items-center justify-center border ${
              isDark
                ? 'border-slate-700 hover:bg-slate-800 text-amber-400'
                : 'border-slate-300 hover:bg-slate-100 text-slate-600'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden glass border-t border-white/[0.06] px-4 py-3 space-y-1">
            {!authTeacher ? (
              <>
                <button onClick={() => nav('landing')} className="block w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition">Home</button>
                <button onClick={() => nav('login')} className="block w-full text-left px-3 py-2 text-sm text-blue-400 rounded-lg hover:bg-blue-500/10 transition">Teacher Login</button>
                <button onClick={() => nav('student')} className="block w-full text-left px-3 py-2 text-sm text-purple-400 rounded-lg hover:bg-purple-500/10 transition">Student View</button>
              </>
            ) : (
              <>
                <p className="px-3 py-2 text-sm text-slate-300">{authTeacher.name}</p>
                <button onClick={() => { setAuthTeacher(null); nav('landing'); }} className="block w-full text-left px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10 transition">Logout</button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Pages */}
      {currentPage === 'landing' && <LandingPage nav={nav} />}
      {currentPage === 'login' && !authTeacher && <LoginPage teachers={TEACHERS_DB} setAuthTeacher={setAuthTeacher} nav={nav} />}
      {currentPage === 'dashboard' && authTeacher && (
        <TeacherDashboard
          authTeacher={authTeacher}
          lectures={lectures}
          setLectures={setLectures}
          checkConflicts={checkConflicts}
          findAlternatives={findAlternatives}
        />
      )}
      {currentPage === 'student' && <StudentView lectures={lectures} />}
    </div>
  );
};

// ─── Landing Page ─────────────────────────────────────────────────────────────
const LandingPage = ({ nav }) => (
  <div className="max-w-6xl mx-auto px-4 pt-24 pb-24">
    <div className="text-center mb-20">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400 font-semibold mb-6 tracking-wide uppercase">
        Smart University Scheduling
      </div>
      <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
        <span className="bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Schedule</span>
        <br />
        <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Without Conflict</span>
      </h1>
      <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
        Makeup lecture management, real-time room availability, and structured conflict detection — built for modern universities.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => nav('login')} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-sm">
          Teacher Portal →
        </button>
        <button onClick={() => nav('student')} className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition text-sm">
          View Schedule
        </button>
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-4 mt-12">
      {[
        { icon: Building2, color: 'blue', title: 'Structured Room Selection', desc: 'Block + number dropdown auto-generates room codes. No typos, no invalid rooms.' },
        { icon: Calendar, color: 'indigo', title: 'Calendar Date Picker', desc: 'Pick exact dates — weekday is derived automatically for conflict checking.' },
        { icon: Users, color: 'purple', title: 'Public Student View', desc: 'Students see teacher name, date, slot, room and status without logging in.' },
      ].map(({ icon: Icon, color, title, desc }) => (
        <div key={title} className="card p-7 hover:border-blue-500/30 transition group">
          <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 flex items-center justify-center mb-5 group-hover:bg-${color}-500/20 transition`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
          </div>
          <h3 className="font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>

    <div className="card p-8 mt-8">
      <h2 className="text-xl font-bold text-white mb-5">Quick Workflow</h2>
      <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-400">
        {[
          '🔑 Teachers log in with university credentials',
          '📅 Pick subject, type, date, section, and slot',
          '🏛️ Choose block + room number — room name auto-generates',
          '⚡ System validates conflicts in real time',
          '🔄 Alternatives suggested if a slot is taken',
          '👁️ Students view full schedule without login',
        ].map((item) => (
          <p key={item} className="flex items-start gap-2">{item}</p>
        ))}
      </div>
    </div>
  </div>
);

// ─── Login Page ───────────────────────────────────────────────────────────────
const LoginPage = ({ teachers, setAuthTeacher, nav }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [sd, setSd] = useState({ name: '', email: '', password: '', department: 'CS' });

  const handleLogin = (e) => {
    e.preventDefault();
    const t = teachers.find((t) => t.email === email && t.password === password);
    if (t) { setAuthTeacher(t); nav('dashboard'); }
    else setError('Invalid credentials. Try the demo account below.');
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (!sd.name || !sd.email || !sd.password) { setError('All fields required'); return; }
    setAuthTeacher({ name: sd.name, email: sd.email, department: sd.department, password: sd.password });
    nav('dashboard');
  };

  const Field = ({ type = 'text', placeholder, value, onChange }) => (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition text-sm" />
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">{isSignup ? 'Create Account' : 'Welcome back'}</h2>
          <p className="text-slate-500 text-sm mt-1">{isSignup ? 'Sign up for teacher access' : 'Sign in to your teacher portal'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
          </div>
        )}

        <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-3">
          {isSignup && (
            <>
              <Field placeholder="Full Name" value={sd.name} onChange={(e) => setSd({ ...sd, name: e.target.value })} />
              <Sel value={sd.department} onChange={(e) => setSd({ ...sd, department: e.target.value })}>
                <option value="CS">Computer Science</option>
                <option value="SE">Software Engineering</option>
                <option value="AI">Artificial Intelligence</option>
                <option value="MS">Management Sciences</option>
              </Sel>
            </>
          )}
          <Field type="email" placeholder="Email address" value={isSignup ? sd.email : email}
            onChange={(e) => isSignup ? setSd({ ...sd, email: e.target.value }) : setEmail(e.target.value)} />
          <Field type="password" placeholder="Password" value={isSignup ? sd.password : password}
            onChange={(e) => isSignup ? setSd({ ...sd, password: e.target.value }) : setPassword(e.target.value)} />
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-sm mt-2">
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsSignup(!isSignup); setError(''); }} className="text-sm text-blue-400 hover:text-blue-300 transition">
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        {!isSignup && (
          <div className="mt-6 p-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300 mb-2">Demo Credentials</p>
            {TEACHERS_DB.map((t) => (
              <button key={t.id} onClick={() => { setEmail(t.email); setPassword(t.password); setError(''); }}
                className="block w-full text-left hover:text-slate-200 transition py-0.5">
                {t.name} — <span className="mono">{t.email}</span>
              </button>
            ))}
            <p className="text-slate-600 mt-1">Password: <span className="mono">pass123</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Teacher Dashboard ────────────────────────────────────────────────────────
const TeacherDashboard = ({ authTeacher, lectures, setLectures, checkConflicts, findAlternatives }) => {
  const [tab, setTab] = useState('arrange');
  const [formData, setFormData] = useState({
    subject: '',
    type: 'Lecture',
    department: 'BSCS',
    semester: 1,
    section: 'A',
    date: '',
    slot: 'Slot 1',
    block: '',
    roomNumber: '',
  });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [alternatives, setAlternatives] = useState([]);

  const derivedDay = getDayFromDate(formData.date);
  const derivedRoom = formData.block && formData.roomNumber
    ? generateRoomName(formData.block, formData.roomNumber, formData.type)
    : '';

  const showMsg = (type, text) => {
    setMsg({ type, text });
    if (type === 'success') setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const upd = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  const handleArrange = (e) => {
    e.preventDefault();
    if (!formData.subject) { showMsg('error', 'Subject name is required.'); return; }
    if (!formData.date) { showMsg('error', 'Please select a date.'); return; }
    if (!formData.block || !formData.roomNumber) { showMsg('error', 'Please select block and room number.'); return; }
    if (!derivedDay) { showMsg('error', 'Selected date is not a weekday (Mon–Fri).'); return; }

    const newLec = {
      id: Date.now(),
      subject: formData.subject,
      type: formData.type,
      department: formData.department,
      teacher: authTeacher.name,
      semester: formData.semester,
      section: formData.section,
      date: formData.date,
      day: derivedDay,
      slot: formData.slot,
      room: derivedRoom,
      status: 'scheduled',
      createdBy: authTeacher.name,
    };

    const { hasConflict, conflicts } = checkConflicts(newLec);
    if (hasConflict) {
      let errMsg = 'Conflict: ';
      if (conflicts.room) errMsg += 'Room already booked. ';
      if (conflicts.teacher) errMsg += 'Teacher has another class. ';
      if (conflicts.students) errMsg += 'Students are already occupied. ';
      if (conflicts.labSlot) errMsg += 'Lab must use consecutive slots (1-2, 2-3, or 4-5). ';
      setAlternatives(findAlternatives(newLec));
      showMsg('error', errMsg);
      return;
    }

    setLectures((prev) => [...prev, newLec]);
    setAlternatives([]);
    showMsg('success', `Lecture "${formData.subject}" scheduled for ${formatDate(formData.date)} in ${derivedRoom}.`);
    setFormData({ subject: '', type: 'Lecture', department: 'BSCS', semester: 1, section: 'A', date: '', slot: 'Slot 1', block: '', roomNumber: '' });
  };

  const handleCancel = (id) => {
    const lec = lectures.find((l) => l.id === id);
    if (lec?.createdBy === authTeacher.name) {
      setLectures((prev) => prev.filter((l) => l.id !== id));
      showMsg('success', 'Lecture cancelled.');
    }
  };

  const myLectures = lectures.filter((l) => l.createdBy === authTeacher.name);

  const tabs = [
    { key: 'arrange', label: 'Arrange Lecture', icon: Plus },
    { key: 'schedule', label: 'My Schedule', icon: Calendar },
    { key: 'rooms', label: 'Room Overview', icon: Building2 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 pt-10 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Teacher Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Arrange makeup lectures and manage your schedule</p>
      </div>

      {msg.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm border ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          {msg.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-white/[0.06]">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition ${tab === key ? 'tab-active' : 'tab-inactive'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Arrange Tab ── */}
      {tab === 'arrange' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-8">
            <h2 className="text-xl font-bold text-white mb-6">New Makeup Lecture</h2>
            <form onSubmit={handleArrange} className="space-y-5">

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject Name</label>
                <input type="text" placeholder="e.g. Object Oriented Programming"
                  value={formData.subject} onChange={(e) => upd('subject', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition text-sm" />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Lecture Type</label>
                <Sel value={formData.type} onChange={(e) => {
                  const t = e.target.value;
                  upd('type', t);
                  upd('block', '');
                  upd('roomNumber', '');
                  upd('slot', t === 'Lab' ? 'Slot 1 + Slot 2' : 'Slot 1');
                }}>
                  <option value="Lecture">Lecture (1.5 hrs — 1 slot)</option>
                  <option value="Lab">Lab (3 hrs — 2 consecutive slots)</option>
                </Sel>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                <Sel value={formData.department} onChange={(e) => upd('department', e.target.value)}>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Sel>
              </div>

              {/* Semester & Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Semester</label>
                  <Sel value={formData.semester} onChange={(e) => upd('semester', parseInt(e.target.value))}>
                    {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                  </Sel>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Section</label>
                  <Sel value={formData.section} onChange={(e) => upd('section', e.target.value)}>
                    {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
                  </Sel>
                </div>
              </div>

              {/* Date picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" value={formData.date} onChange={(e) => upd('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition text-sm" />
                {formData.date && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {derivedDay
                      ? <span>📅 <strong className="text-slate-300">{derivedDay}</strong>, {formatDate(formData.date)}</span>
                      : <span className="text-red-400">⚠ Please pick a weekday (Mon–Fri)</span>}
                  </p>
                )}
              </div>

              {/* Slot */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Time Slot {formData.type === 'Lab' && <span className="text-amber-400">(3-hour consecutive pair)</span>}
                </label>
                <Sel value={formData.slot} onChange={(e) => upd('slot', e.target.value)}>
                  {formData.type === 'Lab' ? (
                    <>
                      <option value="Slot 1 + Slot 2">Slot 1 + Slot 2 (8:30 – 11:30)</option>
                      <option value="Slot 2 + Slot 3">Slot 2 + Slot 3 (10:00 – 1:00)</option>
                      <option value="Slot 4 + Slot 5">Slot 4 + Slot 5 (1:30 – 4:30)</option>
                    </>
                  ) : (
                    SLOTS.map((s) => (
                      <option key={s.name} value={s.name}>{s.name} ({s.time})</option>
                    ))
                  )}
                </Sel>
              </div>

              {/* Room Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Room Selection</label>
                <RoomSelector
                  block={formData.block}
                  number={formData.roomNumber}
                  lectureType={formData.type}
                  onBlockChange={(v) => upd('block', v)}
                  onNumberChange={(v) => upd('roomNumber', v)}
                />
              </div>

              <button type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-sm mt-2">
                Schedule Lecture
              </button>
            </form>
          </div>

          {/* Alternatives sidebar */}
          <div className="space-y-4">
            {alternatives.length > 0 && (
              <div className="card p-6 border-amber-500/30">
                <h3 className="font-bold text-amber-300 mb-4 flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4" /> Suggested Alternatives
                </h3>
                <div className="space-y-2">
                  {alternatives.map((alt, i) => (
                    <div key={i} className="p-3 bg-slate-800 rounded-lg text-xs text-slate-300 space-y-0.5">
                      <p className="font-semibold text-amber-300">{alt.day} — {formatDate(alt.date)}</p>
                      <p className="text-slate-400">{alt.slot} ({alt.time})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary card */}
            <div className="card p-6">
              <h3 className="font-bold text-white mb-4 text-sm">Preview</h3>
              <div className="space-y-2 text-xs">
                {[
                  ['Subject', formData.subject || '—'],
                  ['Type', formData.type],
                  ['Teacher', authTeacher.name],
                  ['Department', formData.department],
                  ['Semester', formData.semester],
                  ['Section', `Section ${formData.section}`],
                  ['Date', formData.date ? formatDate(formData.date) : '—'],
                  ['Day', derivedDay || '—'],
                  ['Slot', formData.slot],
                  ['Room', derivedRoom || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className={`font-medium ${v === '—' ? 'text-slate-600' : 'text-white'} mono`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Tab ── */}
      {tab === 'schedule' && (
        <div className="card p-8">
          <h2 className="text-xl font-bold text-white mb-6">My Scheduled Lectures</h2>
          {myLectures.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No lectures arranged yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLectures.map((lec) => (
                <div key={lec.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-blue-500/40 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="font-bold text-white">{lec.subject}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${lec.type === 'Lab' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                          {lec.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1.5 text-xs text-slate-400">
                        <span><span className="text-slate-600">Teacher</span> {lec.teacher}</span>
                        <span><span className="text-slate-600">Room</span> <strong className="text-slate-300 mono">{lec.room}</strong></span>
                        <span><span className="text-slate-600">Date</span> {formatDate(lec.date)}</span>
                        <span><span className="text-slate-600">Day</span> {lec.day}</span>
                        <span><span className="text-slate-600">Slot</span> {lec.slot}</span>
                        <span><span className="text-slate-600">Dept</span> {lec.department}</span>
                        <span><span className="text-slate-600">Sem</span> {lec.semester}</span>
                        <span><span className="text-slate-600">Section</span> {lec.section}</span>
                      </div>
                    </div>
                    <button onClick={() => handleCancel(lec.id)}
                      className="shrink-0 px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Rooms Tab ── */}
      {tab === 'rooms' && (
        <div className="card p-8">
          <h2 className="text-xl font-bold text-white mb-6">Room Booking Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-slate-500 text-xs font-semibold uppercase tracking-wider">Room</th>
                  <th className="px-4 py-3 text-left text-slate-500 text-xs font-semibold uppercase tracking-wider">Type</th>
                  {DAYS.map((d) => (
                    <th key={d} className="px-4 py-3 text-center text-slate-500 text-xs font-semibold uppercase tracking-wider">{d.slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(lectures.map((l) => l.room))).map((roomName) => {
                  const type = roomName.includes('LAB') ? 'Lab' : 'Lecture';
                  return (
                    <tr key={roomName} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3 font-bold text-white mono text-sm">{roomName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${type === 'Lab' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                          {type}
                        </span>
                      </td>
                      {DAYS.map((day) => {
                        const count = lectures.filter((l) => l.room === roomName && l.day === day).length;
                        return (
                          <td key={day} className="px-4 py-3 text-center text-xs">
                            {count === 0
                              ? <span className="text-green-500 font-semibold">Free</span>
                              : <span className="text-red-400 font-semibold">{count}×</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {lectures.length === 0 && (
                  <tr><td colSpan={DAYS.length + 2} className="text-center py-10 text-slate-600">No lectures scheduled yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Student View ─────────────────────────────────────────────────────────────
const StudentView = ({ lectures }) => {
  const [filters, setFilters] = useState({ department: 'BSCS', semester: 1, section: 'A' });
  const [searched, setSearched] = useState(false);

  const filteredLectures = lectures.filter(
    (l) => l.department === filters.department && l.semester === filters.semester && l.section === filters.section
  );

  const upd = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  const statusBadge = (status) =>
    status === 'scheduled'
      ? <span className="badge-scheduled px-2.5 py-1 rounded-full text-xs font-semibold">✓ Scheduled</span>
      : <span className="badge-cancelled px-2.5 py-1 rounded-full text-xs font-semibold">{status}</span>;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-10 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Student Schedule</h1>
        <p className="text-slate-500 text-sm mt-1">View all makeup lectures for your class group</p>
      </div>

      <div className="card p-6 mb-8">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
            <Sel value={filters.department} onChange={(e) => upd('department', e.target.value)}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Sel>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Semester</label>
            <Sel value={filters.semester} onChange={(e) => upd('semester', parseInt(e.target.value))}>
              {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </Sel>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Section</label>
            <Sel value={filters.section} onChange={(e) => upd('section', e.target.value)}>
              {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
            </Sel>
          </div>
          <div className="flex items-end">
            <button onClick={() => setSearched(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-sm">
              View Schedule
            </button>
          </div>
        </div>
      </div>

      {searched && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">
              {filters.department} · Semester {filters.semester} · Section {filters.section}
            </h2>
            <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-400">
              {filteredLectures.length} lecture{filteredLectures.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredLectures.length === 0 ? (
            <div className="card p-16 text-center text-slate-600">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No lectures found for this group</p>
            </div>
          ) : (
            <div className="overflow-x-auto card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Subject', 'Teacher', 'Type', 'Room', 'Day', 'Date', 'Slot', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLectures.map((lec) => (
                    <tr key={lec.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-semibold text-white">{lec.subject}</td>
                      <td className="px-5 py-4 text-slate-300">{lec.teacher}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${lec.type === 'Lab' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                          {lec.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 mono text-slate-300 font-semibold">{lec.room}</td>
                      <td className="px-5 py-4 text-slate-400">{lec.day}</td>
                      <td className="px-5 py-4 text-slate-400 whitespace-nowrap">{formatDate(lec.date)}</td>
                      <td className="px-5 py-4 text-slate-400 whitespace-nowrap">{lec.slot}</td>
                      <td className="px-5 py-4">{statusBadge(lec.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UniversitySchedulingSystem;
