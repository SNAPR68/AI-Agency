INSERT INTO brands (
  id,
  name,
  slug,
  vertical,
  gmv_band,
  timezone,
  status
)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'Luna Skin',
    'demo',
    'Beauty / Skincare',
    '$5M-$10M',
    'America/Los_Angeles',
    'active'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Solstice Well',
    'solstice',
    'Wellness / Supplements',
    '$10M-$20M',
    'America/New_York',
    'active'
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  vertical = EXCLUDED.vertical,
  gmv_band = EXCLUDED.gmv_band,
  timezone = EXCLUDED.timezone,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO brand_users (
  id,
  brand_id,
  email,
  full_name,
  job_title,
  role,
  status
)
VALUES
  (
    '11111111-aaaa-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'aly@lunaskin.com',
    'Aly Khan',
    'Growth Lead',
    'growth_marketer',
    'active'
  ),
  (
    '11111111-bbbb-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'mira@lunaskin.com',
    'Mira Sol',
    'Founder',
    'founder',
    'active'
  ),
  (
    '11111111-cccc-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'jon@agency.app',
    'Jon Park',
    'Agency Operator',
    'operator',
    'active'
  ),
  (
    '11111111-dddd-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'nina@lunaskin.com',
    'Nina Hart',
    'Operations Manager',
    'operator',
    'invited'
  ),
  (
    '22222222-aaaa-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'jon@agency.app',
    'Jon Park',
    'Agency Operator',
    'operator',
    'active'
  ),
  (
    '22222222-bbbb-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'priya@solsticewell.com',
    'Priya Rao',
    'Content Lead',
    'content_lead',
    'active'
  ),
  (
    '22222222-cccc-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'diego@solsticewell.com',
    'Diego Chen',
    'E-commerce Manager',
    'ecommerce_manager',
    'active'
  ),
  (
    '22222222-dddd-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'rhea@solsticewell.com',
    'Rhea Patel',
    'Growth Analyst',
    'growth_marketer',
    'invited'
  )
ON CONFLICT (brand_id, email) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  job_title = EXCLUDED.job_title,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO brand_profiles (
  id,
  brand_id,
  positioning,
  target_customer,
  hero_products,
  channel_focus,
  goals_json
)
VALUES
  (
    '11111111-eeee-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'Science-backed skincare that makes overnight recovery feel simple and believable.',
    'Women 24-40 with sensitive or stressed skin who want visible payoff without a 12-step routine.',
    '["Overnight Reset Serum", "Daily Barrier Cream"]'::jsonb,
    '["meta", "ga4", "klaviyo"]'::jsonb,
    '{"customerPersonas":["Barrier-repair buyer","Low-effort routine seeker","Paid-social proof converter"]}'::jsonb
  ),
  (
    '22222222-eeee-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'Wellness routines that feel easy to repeat and worth paying for, even without constant discounts.',
    'Adults 26-44 trying to build a sustainable night routine around better sleep and lower stress.',
    '["Sleep Stack Bundle", "Magnesium Gummies"]'::jsonb,
    '["meta", "ga4", "klaviyo"]'::jsonb,
    '{"customerPersonas":["Routine rebuilder","Taste-led supplement buyer","Bundle value defender"]}'::jsonb
  )
ON CONFLICT (brand_id) DO UPDATE
SET
  positioning = EXCLUDED.positioning,
  target_customer = EXCLUDED.target_customer,
  hero_products = EXCLUDED.hero_products,
  channel_focus = EXCLUDED.channel_focus,
  goals_json = EXCLUDED.goals_json,
  updated_at = NOW();

INSERT INTO brand_voice_profiles (
  id,
  brand_id,
  tone,
  do_say,
  dont_say,
  examples
)
VALUES
  (
    '11111111-ffff-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'Warm, assured, low-hype, proof-led.',
    '["overnight recovery","sensitive-skin trust","proof before hype"]'::jsonb,
    '["miracle skin","flawless overnight","aggressive clinical jargon"]'::jsonb,
    '[]'::jsonb
  ),
  (
    '22222222-ffff-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'Calm, practical, habit-forming, premium.',
    '["routine consistency","better nights","habit support"]'::jsonb,
    '["knockout effect","cheap sleep fix","medicalized over-claims"]'::jsonb,
    '[]'::jsonb
  )
ON CONFLICT (brand_id) DO UPDATE
SET
  tone = EXCLUDED.tone,
  do_say = EXCLUDED.do_say,
  dont_say = EXCLUDED.dont_say,
  examples = EXCLUDED.examples,
  updated_at = NOW();

INSERT INTO integration_connections (
  id,
  brand_id,
  provider,
  account_label,
  status,
  last_synced_at
)
VALUES
  (
    '11111111-0001-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'shopify',
    'Luna Skin Shopify',
    'connected',
    '2026-03-25T09:15:00Z'
  ),
  (
    '11111111-0002-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'meta',
    'Luna Skin Ads',
    'connected',
    '2026-03-25T08:50:00Z'
  ),
  (
    '11111111-0003-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'ga4',
    'Luna Skin GA4',
    'degraded',
    '2026-03-24T21:10:00Z'
  ),
  (
    '11111111-0004-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'klaviyo',
    'Luna Skin Klaviyo',
    'pending',
    '2026-03-20T16:00:00Z'
  ),
  (
    '22222222-0001-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'shopify',
    'Solstice Well Shopify',
    'connected',
    '2026-03-25T09:42:00Z'
  ),
  (
    '22222222-0002-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'meta',
    'Solstice Well Ads',
    'degraded',
    '2026-03-24T19:18:00Z'
  ),
  (
    '22222222-0003-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'ga4',
    'Solstice Well GA4',
    'connected',
    '2026-03-25T09:30:00Z'
  ),
  (
    '22222222-0004-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'klaviyo',
    'Solstice Well Klaviyo',
    'connected',
    '2026-03-25T07:52:00Z'
  )
ON CONFLICT (brand_id, provider) DO UPDATE
SET
  account_label = EXCLUDED.account_label,
  status = EXCLUDED.status,
  last_synced_at = EXCLUDED.last_synced_at,
  updated_at = NOW();

INSERT INTO stores (
  id,
  brand_id,
  platform,
  shop_domain,
  currency,
  status,
  connected_at
)
VALUES
  (
    '11111111-1001-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'shopify',
    'lunaskin.myshopify.com',
    'USD',
    'connected',
    '2026-03-20T10:15:00Z'
  ),
  (
    '22222222-1001-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'shopify',
    'solsticewell.myshopify.com',
    'USD',
    'connected',
    '2026-03-18T11:05:00Z'
  )
ON CONFLICT (brand_id, shop_domain) DO UPDATE
SET
  currency = EXCLUDED.currency,
  status = EXCLUDED.status,
  connected_at = EXCLUDED.connected_at,
  updated_at = NOW();

INSERT INTO sync_runs (
  id,
  brand_id,
  provider,
  status,
  started_at,
  finished_at,
  records_processed,
  error_message,
  metadata_json
)
VALUES
  (
    '11111111-2001-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'shopify',
    'success',
    '2026-03-25T09:10:00Z',
    '2026-03-25T09:15:00Z',
    482,
    NULL,
    '{"triggerLabel":"Manual sync from integrations","source":"seeded"}'::jsonb
  ),
  (
    '11111111-2002-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'ga4',
    'failed',
    '2026-03-24T21:05:00Z',
    '2026-03-24T21:10:00Z',
    0,
    'OAuth token expired before property fetch completed.',
    '{"triggerLabel":"Nightly scheduled sync","source":"simulated"}'::jsonb
  ),
  (
    '22222222-2001-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'shopify',
    'success',
    '2026-03-25T09:36:00Z',
    '2026-03-25T09:42:00Z',
    615,
    NULL,
    '{"triggerLabel":"Manual sync from integrations","source":"seeded"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  started_at = EXCLUDED.started_at,
  finished_at = EXCLUDED.finished_at,
  records_processed = EXCLUDED.records_processed,
  error_message = EXCLUDED.error_message,
  metadata_json = EXCLUDED.metadata_json;

INSERT INTO automation_policies (
  id,
  brand_id,
  name,
  policy_type,
  status,
  config_json
)
VALUES
  (
    '11111111-1001-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'Weekly Founder Brief',
    'brief_delivery',
    'active',
    '{"scope":"Founder + operator inbox","summary":"Generate and deliver the weekly business brief every Monday morning after sync health clears.","triggerLabel":"Mondays at 9:00 AM after green syncs","lastRunAt":"2026-03-24T09:02:00Z","nextRunAt":"2026-03-30T09:00:00Z"}'::jsonb
  ),
  (
    '11111111-1002-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'Publish Failure Escalation',
    'workflow_alert',
    'active',
    '{"scope":"Operators + content leads","summary":"Escalate failed publish jobs into the inbox with retry guidance and owner routing.","triggerLabel":"Immediately on failed publish job","lastRunAt":"2026-03-24T18:10:00Z","nextRunAt":"2026-03-26T18:00:00Z"}'::jsonb
  ),
  (
    '11111111-1999-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'Workspace Guardrails',
    'workspace_controls',
    'active',
    '{"approvalMode":"always_review","autoPublishMode":"never","alertSensitivity":"high","weeklyBriefCadence":"monday_am"}'::jsonb
  ),
  (
    '22222222-1001-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'Retention Risk Watch',
    'retention_alert',
    'active',
    '{"scope":"E-commerce manager + operator","summary":"Escalate weak lifecycle segments when repeat-purchase pacing slips below the expected band.","triggerLabel":"Daily at 8:30 AM","lastRunAt":"2026-03-25T08:30:00Z","nextRunAt":"2026-03-26T08:30:00Z"}'::jsonb
  ),
  (
    '22222222-1002-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'High-Impact Approval Guardrail',
    'approval_policy',
    'paused',
    '{"scope":"Founder approval on high-impact content","summary":"Force founder review for high-visibility or paid content before scheduling.","triggerLabel":"Whenever draft confidence is below threshold","nextRunAt":"2026-03-26T10:00:00Z"}'::jsonb
  ),
  (
    '22222222-1999-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'Workspace Guardrails',
    'workspace_controls',
    'active',
    '{"approvalMode":"confidence_based","autoPublishMode":"approved_only","alertSensitivity":"normal","weeklyBriefCadence":"friday_pm"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  policy_type = EXCLUDED.policy_type,
  status = EXCLUDED.status,
  config_json = EXCLUDED.config_json,
  updated_at = NOW();
