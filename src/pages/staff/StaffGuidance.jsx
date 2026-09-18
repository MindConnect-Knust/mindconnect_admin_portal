import { Link } from "react-router-dom";

/**
 * Guidance for staff. Based on the JED Foundation Faculty Guide and
 * student-of-concern practice (docs/measurement-referral/FACULTY_GUIDANCE.md).
 * The wording is a draft that KCC must review before release.
 */
const SECTIONS = [
  {
    title: "Signs a student may be struggling",
    items: [
      "Repeated absence, or stopping attending altogether.",
      "A marked change in behaviour, mood, appearance or work.",
      "Worrying content in assignments, messages or conversation.",
      "Visible distress, withdrawal, or saying they cannot cope.",
      "Talk of hopelessness, being a burden, or not wanting to be here.",
    ],
  },
  {
    title: "How to approach a student",
    items: [
      "Find a private moment. Say what you have noticed, kindly and specifically.",
      "Ask open questions: “How are things going?” rather than “Are you depressed?”.",
      "Listen more than you speak. You do not need to have answers.",
      "Let them know support exists and that asking for it is normal.",
    ],
  },
  {
    title: "How to refer",
    items: [
      "Use “Refer a student” in this portal. Describe what you observed and what was said.",
      "If you can, tell the student you are connecting them with support.",
      "The support team decides what happens next. You will see the referral’s status, not the details of any care.",
    ],
  },
  {
    title: "If someone may be in immediate danger",
    items: [
      "Contact emergency services and KNUST security at once using the verified contacts.",
      "Stay with the student if it is safe, and do not leave them alone if you believe they are at risk.",
      "Then send a short urgent report here.",
    ],
  },
  {
    title: "What not to do",
    items: [
      "Do not try to diagnose, or tell the student what you think is wrong.",
      "Do not promise to keep everything secret. Safety may require others to know.",
      "Do not question the student confrontationally.",
      "Do not try to become their counsellor.",
      "Do not discuss the student with colleagues, in WhatsApp groups or in email chains.",
      "Do not share screenshots or copy referral details into ordinary email.",
    ],
  },
];

export default function StaffGuidance() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Guidance for staff</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        Staff are not expected to be mental-health professionals. Your part is to notice, reach out, and connect the student with the people who can help.
      </p>
      <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">Draft guidance pending KNUST Counselling Centre review.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">{section.title}</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
      </div>
      <Link to="/staff/emergency" className="inline-block text-sm font-semibold text-emerald-700 underline">Emergency guidance and verified contacts</Link>
    </div>
  );
}
