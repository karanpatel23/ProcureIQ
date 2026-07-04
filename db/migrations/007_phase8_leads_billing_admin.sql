ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'pro', 'enterprise'));
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'not_configured' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'not_configured'));
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS billing_customer_id text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS usage jsonb NOT NULL DEFAULT '{"rfqsCreated":0,"quoteDocumentsUploaded":0,"aiExtractionRuns":0,"teamMembers":1}'::jsonb;

CREATE TABLE IF NOT EXISTS lead_requests (
  id text PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('demo', 'contact')),
  name text NOT NULL,
  work_email text NOT NULL,
  company text NOT NULL,
  industry text,
  main_purchasing_workflow text,
  estimated_supplier_quotes_per_month text,
  current_tools text,
  message text,
  source_path text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_requests_type_created ON lead_requests(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspaces_plan_status ON workspaces(plan, subscription_status);
