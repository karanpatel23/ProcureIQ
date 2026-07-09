'use client';

import { FormEvent, useState } from 'react';

export type CompanyProfile = {
  name: string; industryCategory: string; teamSize?: string; website?: string; procurementEmail?: string;
  mainPurchasingWorkflow?: string; currentTools: string[]; country?: string; currency?: string;
  annualSpendBand?: string; supplierCountBand?: string; taxId?: string; approvalThreshold?: number;
};

const WORKFLOWS = ['materials', 'parts', 'equipment', 'subcontractors', 'packaging', 'services', 'other'];
const TOOLS = ['Email', 'Excel', 'QuickBooks', 'ERP/MRP', 'Other'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'CNY', 'Other'];
const SPEND = ['Under $100K', '$100K–$1M', '$1M–$10M', '$10M–$50M', '$50M+'];
const SUPPLIERS = ['1–10', '11–50', '51–200', '201–1000', '1000+'];

export function CompanyForm({ profile, canManage }: { profile: CompanyProfile; canManage: boolean }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tools, setTools] = useState<string[]>(profile.currentTools ?? []);

  function toggleTool(tool: string) {
    setTools((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setSaving(true);
    const form = new FormData(event.currentTarget);
    const threshold = String(form.get('approvalThreshold') ?? '').trim();
    const payload = {
      name: String(form.get('name') ?? ''),
      industryCategory: String(form.get('industryCategory') ?? ''),
      teamSize: String(form.get('teamSize') ?? ''),
      website: String(form.get('website') ?? ''),
      procurementEmail: String(form.get('procurementEmail') ?? ''),
      mainPurchasingWorkflow: String(form.get('mainPurchasingWorkflow') ?? ''),
      currentTools: tools.length ? tools : ['Email'],
      country: String(form.get('country') ?? ''),
      currency: String(form.get('currency') ?? ''),
      annualSpendBand: String(form.get('annualSpendBand') ?? ''),
      supplierCountBand: String(form.get('supplierCountBand') ?? ''),
      taxId: String(form.get('taxId') ?? ''),
      approvalThreshold: threshold === '' ? '' : Number(threshold),
    };
    try {
      const response = await fetch('/api/workspaces', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'Could not save the company profile.'); setSaving(false); return; }
      setNotice('Company profile saved.');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    const rows: [string, string | undefined][] = [
      ['Industry', profile.industryCategory], ['Country', profile.country], ['Currency', profile.currency],
      ['Annual spend', profile.annualSpendBand], ['Suppliers', profile.supplierCountBand],
      ['Main workflow', profile.mainPurchasingWorkflow], ['Tools', profile.currentTools?.join(', ')],
      ['Approval threshold', profile.approvalThreshold != null ? `${profile.currency ?? ''} ${profile.approvalThreshold.toLocaleString()}`.trim() : undefined],
    ];
    return (
      <div className="settings-card">
        <dl>{rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        <p className="form-hint">Only owners and admins can edit the company profile.</p>
      </div>
    );
  }

  return (
    <form className="company-form settings-card" onSubmit={onSubmit}>
      <div className="field-grid">
        <label className="field field-wide"><span className="field-label">Company name</span><input name="name" defaultValue={profile.name} required minLength={2} /></label>
        <label className="field"><span className="field-label">Industry</span><input name="industryCategory" defaultValue={profile.industryCategory} placeholder="Manufacturing, construction…" required /></label>
        <label className="field"><span className="field-label">Country / region</span><input name="country" defaultValue={profile.country ?? ''} placeholder="United States" /></label>
        <label className="field"><span className="field-label">Currency</span><select name="currency" defaultValue={profile.currency ?? ''}><option value="">Not set</option>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        <label className="field"><span className="field-label">Annual procurement spend</span><select name="annualSpendBand" defaultValue={profile.annualSpendBand ?? ''}><option value="">Not set</option>{SPEND.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
        <label className="field"><span className="field-label">Active suppliers</span><select name="supplierCountBand" defaultValue={profile.supplierCountBand ?? ''}><option value="">Not set</option>{SUPPLIERS.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
        <label className="field"><span className="field-label">Main purchasing workflow</span><select name="mainPurchasingWorkflow" defaultValue={profile.mainPurchasingWorkflow ?? 'materials'}>{WORKFLOWS.map((w) => <option key={w} value={w}>{w[0].toUpperCase() + w.slice(1)}</option>)}</select></label>
        <label className="field"><span className="field-label">Approval threshold <span className="field-sub">requires sign-off above</span></span><input name="approvalThreshold" type="number" min="0" step="100" defaultValue={profile.approvalThreshold ?? ''} placeholder="10000" /></label>
        <label className="field"><span className="field-label">Tax / registration ID <span className="field-sub">optional</span></span><input name="taxId" defaultValue={profile.taxId ?? ''} placeholder="EIN / VAT / GST" /></label>
        <label className="field"><span className="field-label">Team size <span className="field-sub">optional</span></span><input name="teamSize" defaultValue={profile.teamSize ?? ''} placeholder="25 purchasing users" /></label>
        <label className="field"><span className="field-label">Website <span className="field-sub">optional</span></span><input name="website" type="url" defaultValue={profile.website ?? ''} placeholder="https://company.com" /></label>
        <label className="field"><span className="field-label">Procurement email <span className="field-sub">optional</span></span><input name="procurementEmail" type="email" defaultValue={profile.procurementEmail ?? ''} placeholder="purchasing@company.com" /></label>
      </div>

      <fieldset className="tools-fieldset">
        <legend>Current tools</legend>
        <div className="check-grid">
          {TOOLS.map((tool) => (
            <label className="check-row" key={tool}>
              <input type="checkbox" checked={tools.includes(tool)} onChange={() => toggleTool(tool)} />{tool}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}
      <div className="form-actions"><button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save company profile'}</button></div>
    </form>
  );
}
