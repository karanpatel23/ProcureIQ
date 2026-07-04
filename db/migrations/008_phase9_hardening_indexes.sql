CREATE INDEX IF NOT EXISTS idx_suppliers_workspace_status_name ON suppliers(workspace_id, status, name);
CREATE INDEX IF NOT EXISTS idx_rfqs_workspace_created ON rfqs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_documents_workspace_created ON quote_documents(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_extraction_runs_workspace_status_created ON ai_extraction_runs(workspace_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_order_drafts_workspace_status_created ON purchase_order_drafts(workspace_id, status, created_at DESC);
