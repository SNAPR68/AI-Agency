# Database Schema

This package holds the initial Postgres schema for the `agency` MVP.

The baseline migration in `migrations/0001_initial.sql` covers:
- workspace and identity tables
- integration and sync tracking
- commerce and channel performance tables
- opportunities, recommendations, and weekly briefs
- content drafting, approvals, and publishing

The schema is intentionally narrow for the first build:
- Shopify-first
- approval-first
- one publishing workflow
- explainable recommendation storage with `jsonb` evidence fields

