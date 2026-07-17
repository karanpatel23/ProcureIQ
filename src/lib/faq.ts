/**
 * FAQ content, shared by the /faq page and its FAQPage structured data. Answers
 * are written to be genuinely useful and honest (no overclaiming) while naturally
 * covering the terms people search for Corven and procurement software.
 */
export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  {
    q: 'What is Corven?',
    a: 'Corven is an AI-native procurement platform that brings supplier quotes, RFQs, exceptions, and approvals into one clear, human-controlled decision workflow. It helps procurement and purchasing teams request quotes, compare suppliers, and turn the winning quote into a purchase order — with a person in control of every decision.',
  },
  {
    q: 'How does Corven compare supplier quotes?',
    a: 'Corven lines up quotes from multiple suppliers side by side and uses AI to surface the real best value — accounting for price, lead time, and line-item differences — not just the lowest headline number. The comparison is fully transparent: every figure traces back to the source quote, and the recommendation is a starting point you can review, adjust, or override.',
  },
  {
    q: 'Can Corven create and send RFQs?',
    a: 'Yes. Corven helps you build a structured request for quote and send it to multiple suppliers in minutes. An AI advisor suggests items and details, but you stay in control of exactly what goes out and to whom.',
  },
  {
    q: 'Does Corven generate purchase orders?',
    a: 'Corven turns an approved, winning quote into a purchase order draft that a person reviews and approves. Purchase orders are never issued autonomously — a human approves every one before it becomes final.',
  },
  {
    q: 'Is Corven AI-powered — and is the AI autonomous?',
    a: 'Both, on your terms. By default every AI step stops at a human approval gate. If you enable Autopilot in Company settings, the AI executes the chain itself — verifying quotes, comparing, selecting the winner, and drafting the PO — but only where your purchasing policy passes, and it halts with a named exception the moment anything fails a check. Sending a PO to a supplier always remains a human action.',
  },
  {
    q: 'How is Corven different from enterprise AI agents or easy purchasing apps?',
    a: 'Enterprise agent platforms automate deeply but are opaque, priced for the Fortune 1000, and take months to roll out. Easy purchasing apps are quick to adopt but leave the actual work — comparing quotes, deciding, negotiating — to you. Corven is auditable autonomy at self-serve speed: the AI does the work, every action it takes is visible in your Activity feed with the policy reasons attached, and you can be running the same afternoon you sign up.',
  },
  {
    q: 'Who is Corven for?',
    a: 'Corven is built for procurement managers, purchasing teams, finance approvers, and operations leaders at companies that buy from many suppliers — manufacturing, construction, distribution, and similar supplier-heavy industries.',
  },
  {
    q: 'How is Corven different from spreadsheets or email?',
    a: 'Spreadsheets and email scatter quotes across inboxes and files, making side-by-side comparison slow and error-prone. Corven centralizes RFQs, quotes, suppliers, and approvals in one place, adds AI-assisted comparison, and keeps a clear audit trail of who decided what.',
  },
  {
    q: 'Does Corven replace my ERP?',
    a: 'No. Corven is the decision layer that sits in front of purchasing — where quotes are gathered, compared, and approved. It complements ERP and accounting systems rather than replacing them, focusing on the sourcing and approval workflow that those systems handle poorly.',
  },
  {
    q: 'Is my procurement data secure?',
    a: 'Security is foundational. Corven keeps AI outputs in reviewable draft states, records workspace-scoped audit events for sensitive actions, and isolates each company’s data to its own workspace. You can read the details on the security page.',
  },
  {
    q: 'How much does Corven cost?',
    a: 'Corven offers Starter, Growth, and Pro plans, with a custom Enterprise tier for larger teams. See the pricing page for current plan details.',
  },
];
