export const navItems = [
  { href: '/platform', label: 'Platform' },
  { href: '/security', label: 'Security' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export const workflowSteps = [
  ['RFQ creation', 'Create structured requests from part needs, drawings, quantities, and internal notes.'],
  ['Supplier quote ingestion', 'Bring supplier emails, PDFs, spreadsheets, and attachments into one clean workspace.'],
  ['AI extraction', 'Extract pricing, lead times, freight terms, exceptions, and alternates with confidence scores.'],
  ['Quote comparison', 'Review side-by-side supplier options with deltas, missing terms, and source evidence.'],
  ['Human approval', 'Route recommendations to the right approver before any purchasing action moves forward.'],
  ['PO draft and export', 'Generate purchase order drafts that teams can review, edit, and export into existing systems.'],
  ['Supplier memory', 'Preserve supplier history, decisions, pricing patterns, and performance notes for future buying.'],
] as const;

export const industries = [
  ['Manufacturing', 'Compare complex component quotes and keep supplier decisions tied to technical requirements.'],
  ['Construction', 'Coordinate bid packages, substitutions, lead times, and vendor terms across active jobs.'],
  ['Distribution', 'Track supplier responsiveness, landed costs, and recurring replenishment decisions.'],
  ['Industrial services', 'Standardize purchasing for field teams, project work, repairs, and urgent supplier requests.'],
  ['Facility and maintenance operations', 'Turn recurring parts and service quotes into cleaner approvals and better visibility.'],
] as const;

export const features = [
  ['RFQ workspace', 'A shared place for request details, supplier outreach, documents, terms, and decision status.'],
  ['Quote parser', 'AI-assisted extraction for pricing, quantities, lead times, terms, alternates, and exceptions.'],
  ['Comparison engine', 'Normalize supplier responses into a clear table with deltas, caveats, and missing fields.'],
  ['PO draft generator', 'Create editable purchase order drafts for approved teams to review before export.'],
  ['Supplier performance memory', 'Capture response times, pricing history, quality notes, and decision context.'],
  ['Procurement analytics', 'Show cycle times, quote coverage, spend visibility, supplier mix, and bottlenecks.'],
  ['Audit trail and approval controls', 'Record who reviewed, changed, approved, exported, or rejected each purchasing step.'],
] as const;

export const trustControls = [
  'Human approval before purchasing actions',
  'Field-level source traceability',
  'Role-based access for purchasing workflows',
  'Secure document handling for quote files',
  'Audit logs for decisions and exports',
  'No irreversible AI purchasing decisions',
] as const;

export const pricingPlans = [
  ['Starter', 'For lean purchasing teams getting organized.', ['RFQ workspace', 'Quote upload and parsing preview', 'Basic comparison tables', 'Guided setup']],
  ['Growth', 'For teams managing recurring supplier quotes.', ['Multi-user workflows', 'Approval controls', 'Supplier memory', 'Procurement analytics']],
  ['Pro', 'For multi-user procurement and operations teams.', ['Role-based access', 'Audit exports', 'PO draft exports', 'Workflow advisory']],
  ['Enterprise', 'For advanced controls, integrations, and tailored onboarding.', ['Admin readiness', 'Integration planning', 'Security review support', 'Dedicated rollout path']],
] as const;
