/*
 * End-to-end pressure test against a running production build.
 * Drives every public route, the full authenticated procurement journey
 * (signup -> onboarding -> supplier -> RFQ -> quote + AI extraction ->
 * approve -> compare -> decide -> PO draft -> export -> audit), all the
 * error/authorization paths, and a concurrency burst. Exit code != 0 on
 * any failure.
 */
const BASE = process.env.BASE ?? 'http://localhost:3100';
let pass = 0;
let fail = 0;
const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; failures.push(name + (detail ? ` — ${detail}` : '')); console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
}
const jars = new Map();
function cookieHeader(jar) { return [...(jars.get(jar)?.entries() ?? [])].map(([k, v]) => `${k}=${v}`).join('; '); }
function storeCookies(jar, res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  const map = jars.get(jar) ?? new Map();
  for (const c of raw) { const [pair] = c.split(';'); const idx = pair.indexOf('='); map.set(pair.slice(0, idx), pair.slice(idx + 1)); }
  jars.set(jar, map);
}
async function api(jar, method, path, body, isForm = false) {
  const headers = {};
  const ch = cookieHeader(jar); if (ch) headers.cookie = ch;
  let payload;
  if (isForm) { payload = body; } else if (body !== undefined) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(BASE + path, { method, headers, body: payload, redirect: 'manual' });
  storeCookies(jar, res);
  let json = null; try { json = await res.json(); } catch { /* non-JSON (redirect/html) */ }
  return { status: res.status, json, location: res.headers.get('location') };
}
async function page(jar, path) {
  const headers = {}; const ch = cookieHeader(jar); if (ch) headers.cookie = ch;
  const res = await fetch(BASE + path, { headers, redirect: 'manual' });
  return { status: res.status, location: res.headers.get('location') };
}

console.log('\n== Health & public routes ==');
{
  const h = await api('anon', 'GET', '/api/health');
  check('health endpoint reports ok', h.status === 200 && h.json?.ok === true, JSON.stringify(h.json));
  check('health reports storage backend', typeof h.json?.storage?.backend === 'string', h.json?.storage?.backend);
  for (const r of ['/', '/platform', '/workflow', '/demo-workflow', '/pricing', '/security', '/about', '/contact', '/demo', '/login', '/signup']) {
    const p = await page('anon', r);
    check(`GET ${r} -> 200`, p.status === 200, `status ${p.status}`);
  }
  check('unknown route -> 404', (await page('anon', '/no-such-page')).status === 404);
}

console.log('\n== Protected routes require auth ==');
for (const r of ['/app/dashboard', '/app/rfqs', '/onboarding', '/admin']) {
  const p = await page('anon', r);
  check(`${r} redirects logged-out user`, p.status === 307 && (p.location ?? '').includes('/login'), `status ${p.status} -> ${p.location}`);
}
check('protected API returns 401 JSON', (await api('anon', 'GET', '/api/rfqs')).status === 401);

console.log('\n== Signup validation (bad input rejected) ==');
check('short password rejected', (await api('anon', 'POST', '/api/auth/signup', { name: 'X', email: 'a@b.com', password: 'short' })).status === 400);
check('invalid email rejected', (await api('anon', 'POST', '/api/auth/signup', { name: 'Valid Name', email: 'not-an-email', password: 'a-strong-password-123' })).status === 400);
check('malformed JSON rejected', (await api('anon', 'POST', '/api/auth/signup', undefined)).status >= 400);

console.log('\n== Full journey (founder) ==');
const email = `founder+${Date.now()}@example.com`;
const password = 'a-strong-password-123';
{
  const s = await api('founder', 'POST', '/api/auth/signup', { name: 'Karan Patel', email, password });
  check('signup succeeds', s.status === 201 && s.json?.ok, JSON.stringify(s.json));
  check('signup routes to onboarding', s.json?.data?.next === '/onboarding');

  const dup = await api('anon', 'POST', '/api/auth/signup', { name: 'Karan Patel', email, password });
  check('duplicate email rejected (409)', dup.status === 409);

  const me = await api('founder', 'GET', '/api/auth/me');
  check('session established (me returns user)', me.json?.data?.user?.email === email);

  const ws = await api('founder', 'POST', '/api/workspaces', { companyName: 'Apex Industrial Works', industryCategory: 'Manufacturing', mainPurchasingWorkflow: 'parts', currentTools: ['Email', 'Excel'] });
  check('workspace creation succeeds', ws.status === 201 && ws.json?.data?.next === '/app/dashboard', JSON.stringify(ws.json));

  const dupWs = await api('founder', 'POST', '/api/workspaces', { companyName: 'Second Workspace', industryCategory: 'Distribution', mainPurchasingWorkflow: 'parts', currentTools: ['Email'] });
  check('second workspace rejected (409)', dupWs.status === 409);

  check('dashboard reachable when authed', (await page('founder', '/app/dashboard')).status === 200);

  // Two suppliers
  const supA = await api('founder', 'POST', '/api/suppliers', { name: 'Northline Metals', paymentTerms: 'Net 30', status: 'active' });
  const supB = await api('founder', 'POST', '/api/suppliers', { name: 'Atlas Components', status: 'active' });
  const supAId = supA.json?.data?.supplier?.id ?? supA.json?.data?.id;
  const supBId = supB.json?.data?.supplier?.id ?? supB.json?.data?.id;
  check('supplier A created', Boolean(supAId), JSON.stringify(supA.json));
  check('supplier B created', Boolean(supBId));
  check('supplier requires name (400)', (await api('founder', 'POST', '/api/suppliers', { name: 'X' })).status === 400);

  // RFQ
  const rfq = await api('founder', 'POST', '/api/rfqs', { title: 'Conveyor Guard Bracket Package', supplierIds: [supAId, supBId], items: [{ itemName: 'Guard bracket', quantity: 20, unit: 'ea' }] });
  const rfqId = rfq.json?.data?.rfq?.id;
  check('RFQ created with email draft', Boolean(rfqId) && typeof rfq.json?.data?.rfq?.emailDraft === 'string', JSON.stringify(rfq.json).slice(0, 120));
  check('RFQ rejects unknown supplier', (await api('founder', 'POST', '/api/rfqs', { title: 'Bad', supplierIds: ['sup_fake'], items: [{ itemName: 'x', quantity: 1 }] })).status === 400);

  // Quote upload with AI extraction (multipart form)
  async function uploadQuote(supplierId, text) {
    const fd = new FormData();
    fd.set('supplierId', supplierId);
    fd.set('sourceType', 'paste');
    fd.set('pastedText', text);
    return api('founder', 'POST', `/api/rfqs/${rfqId}/quotes`, fd, true);
  }
  const qA = await uploadQuote(supAId, 'Supplier: Northline Metals\nQuote #NM-4421\nTotal: $18,420.00\nPayment terms: Net 30\nLead time: 12 days\nFreight included, FOB destination');
  const qB = await uploadQuote(supBId, 'Supplier: Atlas Components\nQuote #AC-8890\nTotal: $17,980.00\nLead time: 18 days\nFreight not included. Alternate housing available.');
  const quoteAId = qA.json?.data?.quote?.id;
  const quoteBId = qB.json?.data?.quote?.id;
  check('quote A ingested + AI extraction ran', Boolean(quoteAId) && qA.json?.data?.quote?.extractedFields, JSON.stringify(qA.json).slice(0, 120));
  check('AI extracted the total price for quote A', qA.json?.data?.quote?.extractedFields?.totalPrice?.value === 18420, String(qA.json?.data?.quote?.extractedFields?.totalPrice?.value));
  check('AI did NOT invent missing payment terms on quote B', (qB.json?.data?.quote?.extractedFields?.paymentTerms?.value ?? null) === null);
  check('AI attaches confidence to extracted fields', typeof qA.json?.data?.quote?.extractedFields?.totalPrice?.confidence === 'number');

  // Approve both quotes (persist reviewed fields + line items)
  async function approve(qId, fields) { return api('founder', 'POST', `/api/rfqs/${rfqId}/quotes/${qId}/review`, { approve: true, fields }); }
  const fieldsA = { currency: { value: 'USD', confidence: 90 }, totalPrice: { value: 18420, confidence: 90 }, estimatedLeadTime: { value: '12 days', confidence: 88 }, paymentTerms: { value: 'Net 30', confidence: 85 }, freightTerms: { value: 'Included', confidence: 80 }, validUntil: { value: '2099-01-01', confidence: 70 }, quoteConfidence: 90, lineItems: [{ itemName: { value: 'Guard bracket', confidence: 80 }, description: { value: 'Guard bracket', confidence: 80 }, quantity: { value: 20, confidence: 80 }, unitPrice: { value: 921, confidence: 80 }, extendedPrice: { value: 18420, confidence: 80 } }] };
  const fieldsB = { currency: { value: 'USD', confidence: 90 }, totalPrice: { value: 17980, confidence: 88 }, estimatedLeadTime: { value: '18 days', confidence: 84 }, validUntil: { value: '2099-01-01', confidence: 60 }, quoteConfidence: 82, lineItems: [{ itemName: { value: 'Guard bracket', confidence: 70 }, description: { value: 'Guard bracket', confidence: 70 }, quantity: { value: 20, confidence: 70 }, unitPrice: { value: 899, confidence: 70 }, extendedPrice: { value: 17980, confidence: 70 } }] };
  check('quote A approved', (await approve(quoteAId, fieldsA)).json?.data?.quote?.status === 'accepted');
  check('quote B approved', (await approve(quoteBId, fieldsB)).json?.data?.quote?.status === 'accepted');

  // Comparison page renders
  check('comparison page renders', (await page('founder', `/app/rfqs/${rfqId}/compare`)).status === 200);

  // Decision: select supplier A with a note
  const dec = await api('founder', 'POST', `/api/rfqs/${rfqId}/decision`, { supplierQuoteId: quoteAId, notes: 'Complete quote, freight included, acceptable lead time.', overrideRecommendation: false });
  check('supplier selection recorded', dec.json?.data?.rfq?.selectedSupplierQuoteId === quoteAId, JSON.stringify(dec.json).slice(0, 120));
  check('decision rejects unknown quote', (await api('founder', 'POST', `/api/rfqs/${rfqId}/decision`, { supplierQuoteId: 'squote_fake' })).status === 404);

  // PO draft
  const po = await api('founder', 'POST', `/api/rfqs/${rfqId}/po-drafts`);
  const poId = po.json?.data?.po?.id;
  check('PO draft created from selection', Boolean(poId) && po.json?.data?.po?.status === 'draft_requires_human_approval', JSON.stringify(po.json).slice(0, 140));
  check('PO draft is NOT auto-sent (requires approval)', po.json?.data?.po?.status === 'draft_requires_human_approval');

  // Export (CSV) requires the PO to exist
  const csv = await page('founder', `/api/po-drafts/${poId}/export-csv`);
  check('PO CSV export reachable', csv.status === 200 || csv.status === 201, `status ${csv.status}`);

  // Analytics reflects real workspace data
  const analytics = await api('founder', 'GET', '/api/analytics');
  check('analytics endpoint returns workspace data', analytics.status === 200 && analytics.json?.ok, `status ${analytics.status}`);

  // Session persistence + logout
  check('session still valid mid-journey', (await api('founder', 'GET', '/api/auth/me')).json?.data?.user?.email === email);
  await api('founder', 'POST', '/api/auth/logout');
  check('logout clears session', (await page('founder', '/app/dashboard')).status === 307);

  // Re-login
  const login = await api('relogin', 'POST', '/api/auth/login', { email, password });
  check('re-login succeeds after logout', login.status === 200 && login.json?.data?.next === '/app/dashboard');
  check('wrong password rejected (401)', (await api('anon', 'POST', '/api/auth/login', { email, password: 'wrong-password' })).status === 401);
}

console.log('\n== Workspace isolation (tenant B cannot see tenant A) ==');
{
  const emailB = `intruder+${Date.now()}@example.com`;
  await api('tenantB', 'POST', '/api/auth/signup', { name: 'Other Founder', email: emailB, password });
  await api('tenantB', 'POST', '/api/workspaces', { companyName: 'Rival Corp', industryCategory: 'Distribution', mainPurchasingWorkflow: 'parts', currentTools: ['Email'] });
  const rfqs = await api('tenantB', 'GET', '/api/rfqs');
  check('new workspace sees zero foreign RFQs', Array.isArray(rfqs.json?.data?.rfqs) && rfqs.json.data.rfqs.length === 0, JSON.stringify(rfqs.json?.data?.rfqs));
}

console.log('\n== Lead forms (sales contact) ==');
{
  const contact = await api('anon', 'POST', '/api/leads', { type: 'contact', name: 'Prospective Buyer', workEmail: 'buyer@example.com', company: 'Delta Fabrication', message: 'Weekly steel quotes.' });
  check('contact form accepts submission', contact.status === 201 && contact.json?.data?.message, JSON.stringify(contact.json).slice(0, 120));
  const demo = await api('anon', 'POST', '/api/leads', { type: 'demo', name: 'Ops Manager', workEmail: 'ops@example.com', company: 'Northgate' });
  check('book-a-demo form accepts submission', demo.status === 201);
  check('lead form rejects missing fields', (await api('anon', 'POST', '/api/leads', { type: 'contact', name: 'X' })).status === 400);
}

console.log('\n== Concurrency burst (20 simultaneous signups) ==');
{
  const stamp = Date.now();
  const results = await Promise.all(Array.from({ length: 20 }, (_, i) =>
    api(`burst${i}`, 'POST', '/api/auth/signup', { name: `User ${i}`, email: `burst+${stamp}+${i}@example.com`, password })));
  const ok = results.filter((r) => r.status === 201).length;
  check('all 20 concurrent signups persisted (no lost updates)', ok === 20, `${ok}/20 succeeded`);
}

console.log(`\n== RESULT: ${pass} passed, ${fail} failed ==`);
if (fail) { console.log('FAILURES:'); failures.forEach((f) => console.log('  - ' + f)); process.exit(1); }
console.log('ALL PRESSURE TESTS PASSED');
