import { CompanyForm } from '@/components/settings/CompanyForm';
import { canManageWorkspace, requirePageWorkspace } from '@/lib/server/auth';

export const metadata = { title: 'Company settings | ProcureIQ' };

export default async function CompanySettingsPage() {
  const { workspace, membership } = await requirePageWorkspace();
  const profile = {
    name: workspace.name, industryCategory: workspace.industryCategory, teamSize: workspace.teamSize,
    website: workspace.website, procurementEmail: workspace.procurementEmail, mainPurchasingWorkflow: workspace.mainPurchasingWorkflow,
    currentTools: workspace.currentTools ?? [], country: workspace.country, currency: workspace.currency,
    annualSpendBand: workspace.annualSpendBand, supplierCountBand: workspace.supplierCountBand,
    taxId: workspace.taxId, approvalThreshold: workspace.approvalThreshold, autopilot: workspace.autopilot,
  };

  return (
    <main>
      <section className="app-shell">
        <div className="page-head">
          <p className="eyebrow">Company settings</p>
          <h1>{workspace.name}</h1>
          <p>The details ProcureIQ uses to tailor RFQs, approvals, and supplier workflows to how your company buys.</p>
        </div>
        <CompanyForm profile={profile} canManage={canManageWorkspace(membership.role)} />
      </section>
    </main>
  );
}
