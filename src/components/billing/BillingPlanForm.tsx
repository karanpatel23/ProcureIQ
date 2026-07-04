'use client';
import { useState } from 'react';

export function BillingPlanForm({ currentPlan }: { currentPlan: string }) {
  const [status, setStatus] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: form.get('plan') }) });
    const data = await response.json();
    setStatus(response.ok ? (data.billingReady ? 'Plan intent saved. Billing provider is ready for checkout wiring.' : 'Plan intent saved. Billing provider is not configured yet.') : data.error?.message ?? 'Unable to update plan.');
  }
  return <form className="billing-form" onSubmit={submit}><label>Workspace plan<select name="plan" defaultValue={currentPlan}>{['starter','growth','pro','enterprise'].map((plan) => <option key={plan} value={plan}>{plan[0].toUpperCase() + plan.slice(1)}</option>)}</select></label><button className="button primary" type="submit">Save billing intent</button>{status && <p className="form-hint">{status}</p>}</form>;
}
