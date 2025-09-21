import React from 'react';

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      {
        q: 'What is CivicEye?',
        a: (
          <>
            CivicEye is a public grievance reporting platform that helps citizens report local issues like garbage, streetlights,
            water, roads, air quality, and sanitation, and track their resolution.
          </>
        ),
      },
      {
        q: 'How do I create an account?',
        a: (
          <>
            Click <strong>Register</strong> on the home page, enter your name, email, and password, and verify your email if prompted.
            You can log in anytime using your email and password from the <strong>Login</strong> page.
          </>
        ),
      },
      {
        q: 'How do I report a grievance?',
        a: (
          <>
            Go to <strong>Report</strong> after logging in. Fill the form with title, description, category, and location.
            You can attach images and an optional audio note. Submit to create your grievance ticket.
          </>
        ),
      },
    ],
  },
  {
    id: 'tracking-status',
    title: 'Tracking & Status',
    items: [
      {
        q: 'How can I track my grievance?',
        a: (
          <>Open <strong>My Complaints</strong> to see all submissions, their status, and detailed timelines.</>
        ),
      },
      {
        q: 'What do the statuses mean?',
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pending</strong>: Submitted and awaiting review by admins.</li>
            <li><strong>In Progress</strong>: Under investigation or work has started.</li>
            <li><strong>Resolved</strong>: The issue has been fixed and marked complete.</li>
            <li><strong>Rejected</strong>: Declined with a reason (for invalid/duplicate/out-of-scope reports).</li>
          </ul>
        ),
      },
    ],
  },
  {
    id: 'categories-priority',
    title: 'Categories & Priority',
    items: [
      {
        q: 'What categories can I choose?',
        a: (
          <>Common categories include <em>garbage</em>, <em>streetlight</em>, <em>water</em>, <em>road</em>, <em>air</em>, <em>sanitation</em>, and <em>others</em>.</>
        ),
      },
      {
        q: 'How is priority determined?',
        a: (
          <>Priority may be set by admins based on severity and impact. High or emergency priority items are handled first.</>
        ),
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications & Communication',
    items: [
      {
        q: 'How do notifications work?',
        a: (
          <>You receive notifications for updates. Clicking a notification that references a grievance opens its details.</>
        ),
      },
      {
        q: 'Will I get email or push alerts?',
        a: (
          <>Configure alerts in <strong>Settings → Notification Preferences</strong>, depending on device support.</>
        ),
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Transparency',
    items: [
      {
        q: 'Who can see my reports?',
        a: (
          <>Authorized city admins can see your reports. Public pages may show anonymized, non-sensitive information.</>
        ),
      },
      {
        q: 'What data is shared publicly?',
        a: (
          <>We may display category, status, approximate location, and sanitized images while preserving privacy.</>
        ),
      },
    ],
  },
  {
    id: 'feedback-proof',
    title: 'Feedback & Resolution Proof',
    items: [
      {
        q: 'How do I give feedback after resolution?',
        a: (
          <>After a grievance is marked resolved, rate the resolution and leave comments on the grievance details page.</>
        ),
      },
      {
        q: 'Do admins provide proof of resolution?',
        a: (
          <>Admins may upload images or notes as proof when marking a grievance resolved.</>
        ),
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    items: [
      {
        q: 'I can’t submit my report.',
        a: (
          <>Ensure all required fields are filled. If the issue persists, re-login, check your connection, or clear cache.</>
        ),
      },
      {
        q: 'I reported the wrong category/location.',
        a: (
          <>You can edit some details before processing starts. Otherwise, comment on the grievance or submit a corrected one.</>
        ),
      },
    ],
  },
];

const FAQ: React.FC = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Hero */}
      <div className="bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Frequently Asked Questions</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-2xl">Find answers about reporting, tracking, and resolving civic issues using CivicEye.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* TOC */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-20 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">On this page</p>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block px-2 py-1 rounded text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="lg:col-span-9 space-y-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-6">{section.title}</h2>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {section.items.map((item, idx) => {
                  const qId = `${section.id}-${idx}`;
                  return (
                    <div key={idx} id={qId} className="py-5 first:pt-0">
                      <div className="group flex items-start gap-2">
                        <a
                          href={`#${qId}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-1"
                          aria-label="Copy link to this question"
                          title="Copy link to this question"
                        >
                          #
                        </a>
                        <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-slate-100">{item.q}</h3>
                      </div>
                      <div className="mt-2 text-sm md:text-[15px] leading-7 text-slate-700 dark:text-slate-300">
                        {item.a}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="mt-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Still have questions? Contact support from <strong>Settings → Help & Support</strong> or email our team.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FAQ;
