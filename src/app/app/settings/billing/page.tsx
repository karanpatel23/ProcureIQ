import { BillingPlanForm } from '@/components/billing/BillingPlanForm';
import { requirePageWorkspace } from '@/lib/server/auth';
import { env } from '@/lib/server/env';

export const metadata = { title: 'Billing settings | ProcureIQ' };
const planCopy = { starter: 'Lean purchasing teams getting organized', growth: 'Teams managing recurring supplier quotes', pro: 'Multi-user procurement and operations teams', enterprise: 'Advanced controls, integrations, and tailored onboarding' } as const;

export default async function BillingSettingsPage() {
  const { workspace } = await requirePageWorkspace();
  const billingConfigured = env.BILLING_PROVIDER === 'stripe' && Boolean(env.STRIPE_SECRET_KEY);
  const usage = workspace.usage ?? { rfqsCreated: 0, quoteDocumentsUploaded: 0, aiExtractionRuns: 0, teamMembers: 1 };
  return <main><section className="app-shell"><p className="eyebrow">Billing</p><h1>Plan and usage readiness.</h1><div className="analytics-grid"><section className="settings-card"><h2>{workspace.plan?.toUpperCase() ?? 'STARTER'}</h2><p>{planCopy[(workspace.plan ?? 'starter') as keyof typeof planCopy]}</p><p>Status: {workspace.subscriptionStatus ?? 'not_configured'}</p><p>{billingConfigured ? 'Billing provider keys are configured for the next checkout step.' : 'Billing provider keys are not configured. Plan intent can be saved safely without starting billing.'}</p><BillingPlanForm currentPlan={workspace.plan ?? 'starter'} /></section><section className="settings-card"><h2>Usage counters</h2><dl><div><dt>RFQs created</dt><dd>{usage.rfqsCreated}</dd></div><div><dt>Quote documents uploaded</dt><dd>{usage.quoteDocumentsUploaded}</dd></div><div><dt>AI extraction runs</dt><dd>{usage.aiExtractionRuns}</dd></div><div><dt>Team members</dt><dd>{usage.teamMembers}</dd></div></dl></section></div></section></main>;
}
