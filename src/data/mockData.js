// Seed data for the admin portal. This module simulates what a real backend
// would return. `services/api.js` is the only place that reads/mutates this —
// swap that file's internals for real HTTP calls and nothing else needs to change.

let idCounter = 1000;
export const nextId = (prefix) => `${prefix}-${idCounter++}`;

export const DEPARTMENTS = [
  "Psychology",
  "Guidance & Counselling",
  "Social Work",
  "Student Affairs",
  "Public Health",
];

export const PROGRAMS = [
  "BSc. Psychology",
  "BA Sociology",
  "BSc. Public Health",
  "BSc. Nursing",
  "BA Social Work",
];

// ---------------------------------------------------------------------------
// Pending applications (people who signed up but are not yet approved)
// ---------------------------------------------------------------------------
export const seedApplications = [
  {
    id: "app-1",
    role: "counsellor",
    name: "Dr. Abena Osei-Mensah",
    email: "a.oseimensah@university.edu",
    phone: "+233 24 555 0192",
    submittedAt: "2026-07-28T09:15:00Z",
    status: "pending",
    title: "Senior Lecturer, Department of Psychology",
    department: "Psychology",
    yearsExperience: 9,
    licenseNumber: "GPC-11234",
    qualifications: ["PhD Clinical Psychology", "MSc Counselling Psychology"],
    motivation:
      "I've supervised student wellbeing initiatives for six years and would like to extend that support through the formal counselling program, particularly around exam anxiety and career indecision.",
    documents: [
      { name: "License_Certificate.pdf", type: "license" },
      { name: "CV_Osei-Mensah.pdf", type: "cv" },
    ],
  },
  {
    id: "app-2",
    role: "counsellor",
    name: "Mr. Kwabena Antwi",
    email: "k.antwi@university.edu",
    phone: "+233 20 444 7781",
    submittedAt: "2026-07-30T14:02:00Z",
    status: "pending",
    title: "Lecturer, Department of Social Work",
    department: "Social Work",
    yearsExperience: 4,
    licenseNumber: "GPC-15590",
    qualifications: ["MA Social Work", "Certificate in Trauma-Informed Care"],
    motivation:
      "Students in my department frequently approach me informally for support around financial stress and family issues. I'd like to do this within a structured, accountable program.",
    documents: [{ name: "License_Antwi.pdf", type: "license" }],
  },
  {
    id: "app-3",
    role: "peer_listener",
    name: "Efua Boateng",
    email: "efua.boateng@st.university.edu",
    phone: "+233 55 213 9048",
    submittedAt: "2026-07-31T11:40:00Z",
    status: "pending",
    studentId: "UG10441",
    program: "BSc. Psychology",
    yearOfStudy: 3,
    trainingProgram: "Peer Support Certification — Cohort 12",
    trainingCompletionDate: "2026-07-15",
    referees: ["Dr. Abena Osei-Mensah (Academic Advisor)"],
    motivation:
      "I completed the peer support certification this semester and have been volunteering informally at the wellness desk. I want to formally take on cases and support first-year students.",
    documents: [{ name: "Training_Certificate_Boateng.pdf", type: "certificate" }],
  },
  {
    id: "app-4",
    role: "peer_listener",
    name: "Yaw Darko",
    email: "yaw.darko@st.university.edu",
    phone: "+233 27 890 1123",
    submittedAt: "2026-08-01T08:20:00Z",
    status: "pending",
    studentId: "UG10998",
    program: "BA Sociology",
    yearOfStudy: 4,
    trainingProgram: "Peer Support Certification — Cohort 12",
    trainingCompletionDate: "2026-07-15",
    referees: ["Mr. Kwabena Antwi (Course Coordinator)"],
    motivation:
      "As a final-year student who struggled with anxiety in my first year, I want to help incoming students navigate similar challenges using what I learned in training.",
    documents: [{ name: "Training_Certificate_Darko.pdf", type: "certificate" }],
  },
  {
    id: "app-5",
    role: "counsellor",
    name: "Dr. Linda Ampofo",
    email: "l.ampofo@university.edu",
    phone: "+233 24 112 6630",
    submittedAt: "2026-08-02T16:55:00Z",
    status: "pending",
    title: "Lecturer, Department of Public Health",
    department: "Public Health",
    yearsExperience: 6,
    licenseNumber: "GPC-13887",
    qualifications: ["PhD Public Health", "Certificate in Mental Health First Aid"],
    motivation:
      "I'd like to support students dealing with health-related stress and burnout, an area closely tied to my research on student wellbeing.",
    documents: [
      { name: "License_Ampofo.pdf", type: "license" },
      { name: "CV_Ampofo.pdf", type: "cv" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper to build rating trend + activity log for a user
// ---------------------------------------------------------------------------
function buildTrend(baseRating, baseSessions) {
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  return months.map((month, i) => ({
    month,
    avgRating: Math.max(3, Math.min(5, +(baseRating + (Math.sin(i) * 0.3)).toFixed(1))),
    sessions: Math.max(2, Math.round(baseSessions + Math.cos(i) * 4)),
  }));
}

function buildEvaluations(count, baseRating) {
  const comments = [
    "Really helped me work through my exam stress, very patient.",
    "Gave practical steps I could act on immediately.",
    "Felt heard for the first time in a while. Thank you.",
    "Session ran a bit short but still useful.",
    "Excellent listener, created a safe space to talk.",
    "Followed up with resources after our session, appreciated that.",
    "Was a bit late to the session, but the guidance was solid.",
    "Helped me see my situation from a different angle.",
  ];
  const sessionTypes = ["Academic Stress", "Anxiety", "Career Guidance", "Relationships", "Grief Support", "Financial Stress"];
  return Array.from({ length: count }).map((_, i) => ({
    id: nextId("ev"),
    date: new Date(2026, 6, 30 - i * 4).toISOString(),
    studentAlias: `Student #${1000 + i * 7}`,
    rating: Math.max(2, Math.min(5, Math.round(baseRating + (i % 3 === 0 ? -1 : 0)))),
    comment: comments[i % comments.length],
    sessionType: sessionTypes[i % sessionTypes.length],
  }));
}

function buildActivityLog(count) {
  const actions = [
    "Completed counselling session",
    "Logged follow-up notes",
    "Referred student to external support",
    "Scheduled a session",
    "Marked session as no-show",
    "Updated availability",
  ];
  return Array.from({ length: count }).map((_, i) => ({
    id: nextId("act"),
    date: new Date(2026, 6, 29 - i * 3).toISOString(),
    action: actions[i % actions.length],
    details: actions[i % actions.length].includes("session")
      ? `Duration: ${30 + (i % 3) * 15} min`
      : "",
  }));
}

// ---------------------------------------------------------------------------
// Approved counsellors (lecturers/professionals)
// ---------------------------------------------------------------------------
export const seedCounsellors = [
  {
    id: "c-1",
    role: "counsellor",
    name: "Prof. Nana Yaa Frimpong",
    email: "n.frimpong@university.edu",
    phone: "+233 24 601 8820",
    title: "Associate Professor, Department of Psychology",
    department: "Psychology",
    yearsExperience: 14,
    licenseNumber: "GPC-08821",
    specialties: ["Anxiety", "Depression", "Academic Stress"],
    joinedAt: "2024-01-12T00:00:00Z",
    status: "active",
    stats: { sessionsThisMonth: 18, totalSessions: 412, studentsSeen: 189, avgRating: 4.8, avgResponseTimeHrs: 3.2, lastActiveAt: "2026-08-02T18:10:00Z" },
    ratingTrend: buildTrend(4.8, 18),
    evaluations: buildEvaluations(9, 4.8),
    activityLog: buildActivityLog(10),
    adminNotes: [
      { id: nextId("note"), date: "2024-01-12T00:00:00Z", admin: "System", action: "approved", note: "Application approved after credential verification." },
    ],
  },
  {
    id: "c-2",
    role: "counsellor",
    name: "Dr. Michael Owusu",
    email: "m.owusu@university.edu",
    phone: "+233 20 774 5512",
    title: "Lecturer, Department of Guidance & Counselling",
    department: "Guidance & Counselling",
    yearsExperience: 7,
    licenseNumber: "GPC-10456",
    specialties: ["Career Guidance", "Relationships"],
    joinedAt: "2024-06-03T00:00:00Z",
    status: "active",
    stats: { sessionsThisMonth: 12, totalSessions: 201, studentsSeen: 110, avgRating: 4.5, avgResponseTimeHrs: 5.1, lastActiveAt: "2026-08-01T12:40:00Z" },
    ratingTrend: buildTrend(4.5, 12),
    evaluations: buildEvaluations(7, 4.5),
    activityLog: buildActivityLog(8),
    adminNotes: [
      { id: nextId("note"), date: "2024-06-03T00:00:00Z", admin: "System", action: "approved", note: "Application approved." },
    ],
  },
  {
    id: "c-3",
    role: "counsellor",
    name: "Dr. Gifty Asante",
    email: "g.asante@university.edu",
    phone: "+233 27 330 2291",
    title: "Senior Lecturer, Department of Social Work",
    department: "Social Work",
    yearsExperience: 11,
    licenseNumber: "GPC-09102",
    specialties: ["Family Issues", "Financial Stress", "Grief Support"],
    joinedAt: "2023-09-20T00:00:00Z",
    status: "on_hold",
    stats: { sessionsThisMonth: 2, totalSessions: 305, studentsSeen: 152, avgRating: 3.6, avgResponseTimeHrs: 18.4, lastActiveAt: "2026-07-20T09:00:00Z" },
    ratingTrend: buildTrend(3.6, 4),
    evaluations: buildEvaluations(6, 3.4),
    activityLog: buildActivityLog(5),
    adminNotes: [
      { id: nextId("note"), date: "2023-09-20T00:00:00Z", admin: "System", action: "approved", note: "Application approved." },
      { id: nextId("note"), date: "2026-07-22T10:00:00Z", admin: "Admin", action: "on_hold", note: "Response times have slipped significantly and two students flagged missed sessions. Placed on hold pending review." },
    ],
  },
  {
    id: "c-4",
    role: "counsellor",
    name: "Mr. Samuel Boadi",
    email: "s.boadi@university.edu",
    phone: "+233 24 998 4470",
    title: "Lecturer, Department of Public Health",
    department: "Public Health",
    yearsExperience: 5,
    licenseNumber: "GPC-14471",
    specialties: ["Burnout", "Health Anxiety"],
    joinedAt: "2025-02-14T00:00:00Z",
    status: "active",
    stats: { sessionsThisMonth: 9, totalSessions: 98, studentsSeen: 61, avgRating: 4.2, avgResponseTimeHrs: 6.8, lastActiveAt: "2026-08-03T07:30:00Z" },
    ratingTrend: buildTrend(4.2, 9),
    evaluations: buildEvaluations(5, 4.2),
    activityLog: buildActivityLog(6),
    adminNotes: [
      { id: nextId("note"), date: "2025-02-14T00:00:00Z", admin: "System", action: "approved", note: "Application approved." },
    ],
  },
  {
    id: "c-5",
    role: "counsellor",
    name: "Dr. Comfort Adjei",
    email: "c.adjei@university.edu",
    phone: "+233 20 118 6602",
    title: "Lecturer, Department of Psychology",
    department: "Psychology",
    yearsExperience: 3,
    licenseNumber: "GPC-16620",
    specialties: ["Academic Stress", "Anxiety"],
    joinedAt: "2025-11-05T00:00:00Z",
    status: "deactivated",
    stats: { sessionsThisMonth: 0, totalSessions: 44, studentsSeen: 30, avgRating: 2.9, avgResponseTimeHrs: 30.5, lastActiveAt: "2026-06-10T10:00:00Z" },
    ratingTrend: buildTrend(2.9, 1),
    evaluations: buildEvaluations(4, 2.6),
    activityLog: buildActivityLog(3),
    adminNotes: [
      { id: nextId("note"), date: "2025-11-05T00:00:00Z", admin: "System", action: "approved", note: "Application approved." },
      { id: nextId("note"), date: "2026-06-15T00:00:00Z", admin: "Admin", action: "on_hold", note: "Multiple low ratings citing unresponsiveness." },
      { id: nextId("note"), date: "2026-06-25T00:00:00Z", admin: "Admin", action: "deactivated", note: "No improvement after review period; deactivated at department's request." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Approved peer counsellors (students)
// ---------------------------------------------------------------------------
export const seedPeerCounsellors = [
  {
    id: "p-1",
    role: "peer_listener",
    name: "Kojo Mensah",
    email: "kojo.mensah@st.university.edu",
    phone: "+233 55 771 2290",
    studentId: "UG09872",
    program: "BSc. Psychology",
    yearOfStudy: 4,
    trainingCohort: "Cohort 10",
    supervisor: "Prof. Nana Yaa Frimpong",
    joinedAt: "2025-09-01T00:00:00Z",
    status: "active",
    stats: { sessionsThisMonth: 14, totalSessions: 96, studentsSeen: 58, avgRating: 4.7, avgResponseTimeHrs: 2.1, lastActiveAt: "2026-08-02T20:00:00Z" },
    ratingTrend: buildTrend(4.7, 14),
    evaluations: buildEvaluations(6, 4.7),
    activityLog: buildActivityLog(7),
    adminNotes: [
      { id: nextId("note"), date: "2025-09-01T00:00:00Z", admin: "System", action: "approved", note: "Peer counsellor application approved after training verification." },
    ],
  },
  {
    id: "p-2",
    role: "peer_listener",
    name: "Ama Serwaa",
    email: "ama.serwaa@st.university.edu",
    phone: "+233 24 456 8871",
    studentId: "UG10120",
    program: "BA Social Work",
    yearOfStudy: 3,
    trainingCohort: "Cohort 11",
    supervisor: "Dr. Gifty Asante",
    joinedAt: "2025-10-10T00:00:00Z",
    status: "active",
    stats: { sessionsThisMonth: 10, totalSessions: 61, studentsSeen: 40, avgRating: 4.4, avgResponseTimeHrs: 3.9, lastActiveAt: "2026-08-01T15:20:00Z" },
    ratingTrend: buildTrend(4.4, 10),
    evaluations: buildEvaluations(5, 4.4),
    activityLog: buildActivityLog(6),
    adminNotes: [
      { id: nextId("note"), date: "2025-10-10T00:00:00Z", admin: "System", action: "approved", note: "Peer counsellor application approved." },
    ],
  },
  {
    id: "p-3",
    role: "peer_listener",
    name: "Kwesi Appiah",
    email: "kwesi.appiah@st.university.edu",
    phone: "+233 27 662 3341",
    studentId: "UG10345",
    program: "BSc. Public Health",
    yearOfStudy: 2,
    trainingCohort: "Cohort 11",
    supervisor: "Mr. Samuel Boadi",
    joinedAt: "2025-10-10T00:00:00Z",
    status: "on_hold",
    stats: { sessionsThisMonth: 1, totalSessions: 22, studentsSeen: 15, avgRating: 3.3, avgResponseTimeHrs: 15.6, lastActiveAt: "2026-07-15T11:00:00Z" },
    ratingTrend: buildTrend(3.3, 3),
    evaluations: buildEvaluations(4, 3.1),
    activityLog: buildActivityLog(4),
    adminNotes: [
      { id: nextId("note"), date: "2025-10-10T00:00:00Z", admin: "System", action: "approved", note: "Peer counsellor application approved." },
      { id: nextId("note"), date: "2026-07-18T00:00:00Z", admin: "Admin", action: "on_hold", note: "Exam period conflict raised by student; paused caseload temporarily at their request." },
    ],
  },
  {
    id: "p-4",
    role: "peer_listener",
    name: "Abigail Nkrumah",
    email: "abigail.nkrumah@st.university.edu",
    phone: "+233 20 887 4432",
    studentId: "UG10788",
    program: "BSc. Nursing",
    yearOfStudy: 4,
    trainingCohort: "Cohort 12",
    supervisor: "Dr. Michael Owusu",
    joinedAt: "2026-02-20T00:00:00Z",
    status: "active",
    stats: { sessionsThisMonth: 16, totalSessions: 48, studentsSeen: 33, avgRating: 4.9, avgResponseTimeHrs: 1.8, lastActiveAt: "2026-08-03T06:15:00Z" },
    ratingTrend: buildTrend(4.9, 16),
    evaluations: buildEvaluations(6, 4.9),
    activityLog: buildActivityLog(7),
    adminNotes: [
      { id: nextId("note"), date: "2026-02-20T00:00:00Z", admin: "System", action: "approved", note: "Peer counsellor application approved." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Global audit log (seeded with the events already reflected above)
// ---------------------------------------------------------------------------
export const seedAuditLog = [
  { id: nextId("audit"), timestamp: "2026-06-25T00:00:00Z", admin: "Admin", action: "Deactivated", targetName: "Dr. Comfort Adjei", targetRole: "counsellor", reason: "No improvement after review period; deactivated at department's request." },
  { id: nextId("audit"), timestamp: "2026-07-22T10:00:00Z", admin: "Admin", action: "Put on hold", targetName: "Dr. Gifty Asante", targetRole: "counsellor", reason: "Response times have slipped significantly and two students flagged missed sessions." },
  { id: nextId("audit"), timestamp: "2026-07-18T00:00:00Z", admin: "Admin", action: "Put on hold", targetName: "Kwesi Appiah", targetRole: "peer_listener", reason: "Exam period conflict raised by student; paused caseload temporarily at their request." },
];

export const seedNotifications = [
  { id: nextId("notif"), type: "application", message: "Dr. Linda Ampofo applied to become a counsellor.", timestamp: "2026-08-02T16:55:00Z", read: false },
  { id: nextId("notif"), type: "application", message: "Yaw Darko applied to become a peer counsellor.", timestamp: "2026-08-01T08:20:00Z", read: false },
  { id: nextId("notif"), type: "flag", message: "Dr. Comfort Adjei's average rating dropped below 3.0.", timestamp: "2026-06-14T09:00:00Z", read: true },
];

export const CURRENT_ADMIN = {
  name: "William Noble",
  email: "wnoble979@gmail.com",
  role: "Program Administrator",
};
