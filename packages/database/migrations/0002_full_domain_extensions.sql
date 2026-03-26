CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  external_collection_id TEXT NOT NULL,
  title TEXT NOT NULL,
  handle TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, external_collection_id)
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  external_customer_id TEXT NOT NULL,
  email TEXT,
  first_order_at TIMESTAMPTZ,
  last_order_at TIMESTAMPTZ,
  orders_count INTEGER NOT NULL DEFAULT 0,
  lifetime_value NUMERIC(14, 2),
  accepts_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, external_customer_id)
);

CREATE TABLE retention_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  segment_key TEXT,
  repeat_purchase_rate NUMERIC(8, 4),
  customer_ltv NUMERIC(14, 2),
  churn_risk_score NUMERIC(8, 4),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, snapshot_date, segment_key)
);

CREATE TABLE lifecycle_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  segment_key TEXT,
  title TEXT NOT NULL,
  priority_score NUMERIC(8, 4),
  status TEXT NOT NULL DEFAULT 'open',
  evidence_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cx_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  summary TEXT,
  entity_type TEXT,
  entity_id UUID,
  assigned_to UUID REFERENCES brand_users(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE support_issue_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  cluster_key TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  issue_count INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES brand_users(id) ON DELETE SET NULL,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, cluster_key)
);

CREATE TABLE response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'generated',
  summary_md TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by UUID REFERENCES brand_users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES brand_users(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  linked_entity_type TEXT,
  linked_entity_id UUID,
  status TEXT NOT NULL DEFAULT 'unread',
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE automation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES brand_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  automation_policy_id UUID NOT NULL REFERENCES automation_policies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collections_brand_id ON collections (brand_id);
CREATE INDEX idx_customers_brand_id ON customers (brand_id);
CREATE INDEX idx_retention_snapshots_brand_date ON retention_snapshots (brand_id, snapshot_date DESC);
CREATE INDEX idx_lifecycle_opportunities_brand_status ON lifecycle_opportunities (brand_id, status, priority_score DESC);
CREATE INDEX idx_cx_incidents_brand_status ON cx_incidents (brand_id, status, opened_at DESC);
CREATE INDEX idx_support_issue_clusters_brand_status ON support_issue_clusters (brand_id, status, last_seen_at DESC);
CREATE INDEX idx_reports_brand_generated_at ON reports (brand_id, generated_at DESC);
CREATE INDEX idx_inbox_items_brand_user_status ON inbox_items (brand_id, recipient_user_id, status, created_at DESC);
CREATE INDEX idx_automation_policies_brand_status ON automation_policies (brand_id, status);
CREATE INDEX idx_automation_runs_policy_status ON automation_runs (automation_policy_id, status, created_at DESC);
