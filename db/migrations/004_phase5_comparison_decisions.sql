ALTER TABLE rfqs ADD COLUMN selected_supplier_quote_id TEXT REFERENCES supplier_quotes(id) ON DELETE SET NULL;
ALTER TABLE rfqs ADD COLUMN decision_notes TEXT;
ALTER TABLE rfqs ADD COLUMN recommendation_overridden BOOLEAN NOT NULL DEFAULT false;
