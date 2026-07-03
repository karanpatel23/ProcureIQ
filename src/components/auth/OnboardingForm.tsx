'use client';

import { FormEvent, useState } from 'react';

const workflowOptions = ['materials', 'parts', 'equipment', 'subcontractors', 'packaging', 'services', 'other'];
const toolOptions = ['Email', 'Excel', 'QuickBooks', 'ERP/MRP', 'Other'];

export function OnboardingForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      companyName: String(form.get('companyName') ?? ''),
      industryCategory: String(form.get('industryCategory') ?? ''),
      teamSize: String(form.get('teamSize') ?? ''),
      website: String(form.get('website') ?? ''),
      procurementEmail: String(form.get('procurementEmail') ?? ''),
      mainPurchasingWorkflow: String(form.get('mainPurchasingWorkflow') ?? ''),
      currentTools: form.getAll('currentTools').map(String),
    };
    const response = await fetch('/api/workspaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    setLoading(false);
    if (!result.ok) { setError(result.error?.message ?? 'Could not create workspace.'); return; }
    window.location.href = result.data.next;
  }

  return <form className="auth-form onboarding-form" onSubmit={onSubmit}><label>Company name<input name="companyName" required minLength={2} /></label><label>Industry category<input name="industryCategory" placeholder="Manufacturing, construction, distribution…" required /></label><label>Team size <span>Optional</span><input name="teamSize" placeholder="25 purchasing and operations users" /></label><label>Website <span>Optional</span><input name="website" type="url" placeholder="https://company.com" /></label><label>Procurement email <span>Optional</span><input name="procurementEmail" type="email" placeholder="purchasing@company.com" /></label><label>Main purchasing workflow<select name="mainPurchasingWorkflow" required defaultValue="materials">{workflowOptions.map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}</select></label><fieldset><legend>Current tools</legend>{toolOptions.map((tool) => <label className="check-row" key={tool}><input type="checkbox" name="currentTools" value={tool} defaultChecked={tool === 'Email'} />{tool}</label>)}</fieldset>{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary" disabled={loading}>{loading ? 'Creating workspace…' : 'Create workspace'}</button></form>;
}
