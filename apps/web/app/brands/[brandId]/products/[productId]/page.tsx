import Link from "next/link";
import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../../components/data-presentation";
import { WorkspacePage } from "../../../../../components/workspace-page";
import {
  getHostedWriteDisabledMessage,
  hostedWriteDisabledErrorCode
} from "../../../../../lib/session";
import { getBrandProductDetailAsync } from "../../../../../lib/growth-workflow-data";

type ProductDetailPageProps = {
  params: Promise<{
    brandId: string;
    productId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function productTone(status: string): PresentationTone {
  if (status === "rising") {
    return "positive";
  }

  if (status === "watch") {
    return "warning";
  }

  return "neutral";
}

function opportunityTone(status: string): PresentationTone {
  if (status === "accepted") {
    return "positive";
  }

  if (status === "open") {
    return "warning";
  }

  return "neutral";
}

export default async function ProductDetailPage({
  params,
  searchParams
}: ProductDetailPageProps) {
  const { brandId, productId } = await params;
  const { error } = await searchParams;
  const product = await getBrandProductDetailAsync(brandId, productId);

  if (!product) {
    return (
      <WorkspacePage
        model={{
          kicker: "Product Detail",
          title: "Product not found",
          description:
            "This product is not available in the current workflow dataset yet.",
          actions: [
            {
              label: "Back to products",
              href: `/brands/${brandId}/products`
            }
          ]
        }}
      />
    );
  }

  return (
    <WorkspacePage
      model={{
        kicker: "Product Detail",
        title: product.title,
        description: product.summary,
        notice:
          error === hostedWriteDisabledErrorCode ? getHostedWriteDisabledMessage() : undefined,
        actions: [
          {
            label: "Back to Products",
            href: `/brands/${brandId}/products`
          },
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Revenue share",
            value: product.revenueShare,
            note: `Movement ${product.revenueDelta}`
          },
          {
            label: "Conversion",
            value: product.conversionRate,
            note: `Change ${product.conversionDelta}`
          },
          {
            label: "Workflow load",
            value: `${product.opportunities.length} opps / ${product.drafts.length} drafts`,
            note: `${product.marginBand} · ${product.inventoryNote}`
          }
        ]
      }}
    >
      <section className="editorial-story-grid">
        <div className="editorial-main">
          <section className="editorial-section" data-tone="warm">
            <p className="editorial-section-label">Strategy</p>
            <h2 className="editorial-section-title">What the team should reinforce</h2>
            <p className="editorial-section-description">{product.heroMessage}</p>
            <p className="editorial-section-description">{product.watchout}</p>
            <div className="record-actions" style={{ marginTop: "18px" }}>
              <form
                action={`/api/brands/${brandId}/products/${product.id}/generate-draft`}
                className="inline-form"
                method="post"
              >
                <button className="button-link" type="submit">
                  Generate Draft
                </button>
              </form>
              <Link
                className="button-link-secondary"
                href={`/brands/${brandId}/opportunities`}
              >
                Open opportunities
              </Link>
            </div>
          </section>

          <section className="editorial-focus-grid">
            <EditorialListPanel
              label="Opportunities"
              title="Linked decisions"
              description="Open and accepted opportunities tied to this product."
              items={product.opportunities.map((opportunity) => ({
                eyebrow: opportunity.type,
                title: opportunity.title,
                description: `${opportunity.evidence} ${opportunity.recommendation}`,
                value: `${opportunity.priorityScore}`,
                note: "Priority",
                tags: [
                  { label: opportunity.status, tone: opportunityTone(opportunity.status) },
                  { label: `${opportunity.priorityScore} priority`, tone: "info" }
                ],
                actions: [
                  ...(opportunity.linkedDraftHref
                    ? [
                        {
                          label: "Open draft",
                          href: opportunity.linkedDraftHref,
                          tone: "primary" as const
                        }
                      ]
                    : [
                        {
                          label: "Generate draft",
                          href: `/api/brands/${brandId}/opportunities/${opportunity.id}/generate-draft`,
                          method: "post" as const,
                          tone: "primary" as const
                        }
                      ]),
                  {
                    label: "Open queue",
                    href: `/brands/${brandId}/opportunities`,
                    tone: "secondary"
                  }
                ]
              }))}
              emptyMessage="No linked opportunities yet."
            />

            <EditorialListPanel
              label="Drafts"
              title="Content already in motion"
              description="Drafts created from this product or its linked opportunities."
              items={product.drafts.map((draft) => ({
                eyebrow: draft.channel,
                title: draft.title,
                description: `${draft.hook} Last updated ${draft.updatedAtLabel}.`,
                value: draft.status.replaceAll("_", " "),
                note: "Status",
                tags: [
                  { label: draft.status.replaceAll("_", " "), tone: "info" },
                  { label: draft.channel, tone: "neutral" }
                ],
                actions: [
                  {
                    label: "Open draft",
                    href: draft.href,
                    tone: "primary"
                  }
                ]
              }))}
              emptyMessage="No drafts have been generated from this product yet."
            />
          </section>
        </div>

        <aside className="editorial-rail editorial-summary-stack">
          <section className="editorial-section" data-tone="ink">
            <p className="editorial-section-label">Quick Facts</p>
            <h2 className="editorial-section-title">Product intelligence</h2>
            <div className="editorial-metric-grid">
              <article className="editorial-metric-card">
                <p className="editorial-metric-label">Collection</p>
                <p className="editorial-metric-value">{product.collection}</p>
                <p className="editorial-metric-note">{product.status} product</p>
              </article>

              <article className="editorial-metric-card">
                <p className="editorial-metric-label">Margin</p>
                <p className="editorial-metric-value">{product.marginBand}</p>
                <p className="editorial-metric-note">{product.inventoryNote}</p>
              </article>
            </div>
          </section>

          <EditorialListPanel
            label="Recommended formats"
            title="Execution formats worth testing"
            description="These are the formats most likely to support the current product conversation."
            items={product.recommendedFormats.map((format) => ({
              eyebrow: product.status,
              title: format,
              description: `${product.title} can support this format without drifting away from the current business priority.`,
              tags: [{ label: product.status, tone: productTone(product.status) }]
            }))}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
