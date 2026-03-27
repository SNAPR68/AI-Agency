import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getWorkflowNarrativeAsync,
  listBrandProductsAsync
} from "../../../../lib/growth-workflow-data";

type ProductsPageProps = {
  params: Promise<{
    brandId: string;
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

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { brandId } = await params;
  const products = await listBrandProductsAsync(brandId);

  return (
    <WorkspacePage
      model={{
        kicker: "Products",
        title: "Product priority board",
        description: await getWorkflowNarrativeAsync(brandId),
        actions: [
          {
            label: "Generate Hooks",
            href: `/brands/${brandId}/content`
          },
          {
            label: "Open Opportunities",
            href: `/brands/${brandId}/opportunities`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Catalog items",
            value: `${products.length}`,
            note: "Seeded products currently driving this workflow layer."
          },
          {
            label: "Rising products",
            value: `${products.filter((product) => product.status === "rising").length}`,
            note: "Products gaining enough momentum to deserve content support now."
          },
          {
            label: "Needs attention",
            value: `${products.filter((product) => product.status === "watch").length}`,
            note: "Products with enough friction or drift to justify intervention."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Catalog Ledger"
            title="Ranked product priorities"
            description="This board ties the product conversation to revenue movement, conversion health, and direct content actions."
            items={products.map((product) => ({
              eyebrow: `${product.collection} · ${product.status}`,
              title: product.title,
              description: `${product.summary} Conversion ${product.conversionRate} (${product.conversionDelta}). ${product.marginBand}.`,
              value: product.revenueShare,
              note: product.revenueDelta,
              tags: [
                { label: product.status, tone: productTone(product.status) },
                { label: `${product.linkedOpportunityCount} opportunities`, tone: "info" },
                { label: `${product.linkedDraftCount} drafts`, tone: "neutral" }
              ],
              actions: [
                {
                  label: "View product",
                  href: `/brands/${brandId}/products/${product.id}`,
                  tone: "secondary"
                },
                {
                  label: "Generate draft",
                  href: `/api/brands/${brandId}/products/${product.id}/generate-draft`,
                  method: "post",
                  tone: "primary"
                }
              ]
            }))}
            tone="warm"
          />
        </div>

        <aside className="editorial-rail">
          <section className="editorial-section" data-tone="ink">
            <p className="editorial-section-label">Commerce Snapshot</p>
            <h2 className="editorial-section-title">What the board is telling us</h2>
            <p className="editorial-section-description">
              The product layer should rank the catalog by urgency and upside, not just display SKUs.
            </p>

            <div className="editorial-metric-grid">
              <article className="editorial-metric-card">
                <p className="editorial-metric-label">Rising</p>
                <p className="editorial-metric-value">
                  {products.filter((product) => product.status === "rising").length}
                </p>
                <p className="editorial-metric-note">Products gaining enough momentum to support now</p>
              </article>

              <article className="editorial-metric-card">
                <p className="editorial-metric-label">Watch</p>
                <p className="editorial-metric-value">
                  {products.filter((product) => product.status === "watch").length}
                </p>
                <p className="editorial-metric-note">Products leaking enough intent to intervene</p>
              </article>
            </div>
          </section>

          <EditorialListPanel
            label="Usage"
            title="How to use the product board"
            description="This page should move the team from catalog awareness to action."
            items={[
              {
                eyebrow: "Momentum",
                title: "Prioritize rising products first",
                description:
                  "When a SKU is already carrying revenue momentum, the fastest win is usually to support it with fresh creative and sharper planning.",
                tags: [{ label: "Momentum", tone: "positive" }]
              },
              {
                eyebrow: "Intervention",
                title: "Treat watch items as conversion work",
                description:
                  "If traffic exists but conversion is leaking, route the issue into PDP fixes, objection handling, and supporting content.",
                tags: [{ label: "Intervention", tone: "warning" }]
              },
              {
                eyebrow: "Workflow",
                title: "Use the product page as the handoff point",
                description:
                  "Every important SKU should connect directly to opportunities, drafts, and the content operating loop.",
                tags: [{ label: "Workflow", tone: "info" }]
              }
            ]}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
