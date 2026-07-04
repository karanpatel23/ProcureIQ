CREATE INDEX IF NOT EXISTS idx_rfqs_workspace_status_created ON rfqs(workspace_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_workspace_supplier_created ON supplier_quotes(workspace_id, supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_order_drafts_workspace_supplier_created ON purchase_order_drafts(workspace_id, supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_supplier_quote_created ON quote_line_items(supplier_quote_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_action_created ON audit_logs(workspace_id, action, created_at DESC);
