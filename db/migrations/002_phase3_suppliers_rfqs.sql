ALTER TABLE suppliers ADD COLUMN contact_person TEXT;
ALTER TABLE suppliers ADD COLUMN email TEXT;
ALTER TABLE suppliers ADD COLUMN phone TEXT;
ALTER TABLE suppliers ADD COLUMN category TEXT;
ALTER TABLE suppliers ADD COLUMN typical_items TEXT;
ALTER TABLE suppliers ADD COLUMN payment_terms TEXT;
ALTER TABLE suppliers ADD COLUMN notes TEXT;
ALTER TABLE suppliers ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive'));
ALTER TABLE suppliers ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE rfqs ADD COLUMN description TEXT;
ALTER TABLE rfqs ADD COLUMN needed_by DATE;
ALTER TABLE rfqs ADD COLUMN delivery_location TEXT;
ALTER TABLE rfqs ADD COLUMN internal_reference TEXT;
ALTER TABLE rfqs ADD COLUMN supplier_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE rfqs ADD COLUMN email_draft TEXT;
ALTER TABLE rfqs ADD COLUMN sent_at TIMESTAMPTZ;

ALTER TABLE rfq_items ADD COLUMN item_name TEXT;
ALTER TABLE rfq_items ADD COLUMN required_date DATE;
ALTER TABLE rfq_items ADD COLUMN notes TEXT;
UPDATE rfq_items SET item_name = COALESCE(sku, description);
ALTER TABLE rfq_items ALTER COLUMN item_name SET NOT NULL;
