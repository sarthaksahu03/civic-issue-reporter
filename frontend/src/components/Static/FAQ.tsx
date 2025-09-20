import React from 'react';

const FAQ: React.FC = () => {
  const faqs = [
    {
      q: 'What is CivicEye?',
      a: 'CivicEye is a public grievance reporting platform that helps citizens report local issues and track their resolution.'
    },
    {
      q: 'How do I report a grievance?',
      a: 'Go to the Report page after logging in, fill in the details (title, description, category, location), and submit. You can also attach images and audio.'
    },
    {
      q: 'How can I track my grievance?',
      a: 'Open My Complaints to see all your submissions, their statuses, and details.'
    },
    {
      q: 'What do the statuses mean?',
      a: 'Pending: submitted and awaiting review. In Progress: being worked on. Resolved: completed. Rejected: declined with a reason.'
    },
    {
      q: 'How do notifications work?',
      a: 'You receive notifications when there are updates on your grievances. Clicking a notification that references a grievance will open its details.'
    },
    {
      q: 'Who can see my reports?',
      a: 'Your reports are visible to city admins. Public transparency pages may show anonymized, non-sensitive information.'
    },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md divide-y divide-slate-200 dark:divide-slate-700">
          {faqs.map((item, idx) => (
            <details key={idx} className="p-4 group">
              <summary className="cursor-pointer font-semibold list-none flex items-center justify-between">
                <span>{item.q}</span>
                <span className="ml-2 text-slate-500 group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <p className="mt-2 text-slate-700 dark:text-slate-300 text-sm leading-6">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
