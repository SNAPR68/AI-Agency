import Link from "next/link";
import {
  getWorkflowNarrativeAsync,
  listBrandProductsAsync
} from "../../../../lib/growth-workflow-data";

type ProductsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function parseMetricValue(value: string) {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { brandId } = await params;
  const products = await listBrandProductsAsync(brandId);
  const averageConversion = products.length
    ? (
        products.reduce((sum, product) => sum + parseMetricValue(product.conversionRate), 0) /
        products.length
      ).toFixed(2)
    : "0.00";
  const topProduct = products[0];

  return (
    <div className="commerce-suite">
      <header className="command-header">
        <div className="command-header-copy">
          <p className="command-kicker">Commerce Ledger</p>
          <h1 className="command-title">Product Intelligence</h1>
          <p className="command-description">{await getWorkflowNarrativeAsync(brandId)}</p>
        </div>

        <div className="command-actions">
          <button className="command-secondary-button" type="button">
            Compare Periods
          </button>
          <Link className="command-primary-button" href={`/brands/${brandId}/content`}>
            Generate Hooks
          </Link>
        </div>
      </header>

      <section className="commerce-kpi-strip">
        <article className="commerce-kpi-card">
          <p className="commerce-kpi-label">Catalog Items</p>
          <p className="commerce-kpi-value">{products.length}</p>
          <p className="commerce-kpi-note">Products currently ranked in the workspace</p>
        </article>
        <article className="commerce-kpi-card">
          <p className="commerce-kpi-label">Rising Products</p>
          <p className="commerce-kpi-value">
            {products.filter((product) => product.status === "rising").length}
          </p>
          <p className="commerce-kpi-note">High-momentum SKUs worth supporting now</p>
        </article>
        <article className="commerce-kpi-card">
          <p className="commerce-kpi-label">Avg Conversion</p>
          <p className="commerce-kpi-value">{averageConversion}%</p>
          <p className="commerce-kpi-note">Across the currently ranked catalog</p>
        </article>
        <article className="commerce-kpi-card">
          <p className="commerce-kpi-label">Top Growth SKU</p>
          <p className="commerce-kpi-value commerce-kpi-value-small">
            {topProduct?.title ?? "No product"}
          </p>
          <p className="commerce-kpi-note">{topProduct?.revenueDelta ?? "Waiting for sync"}</p>
        </article>
      </section>

      <section className="commerce-toolbar">
        <div className="command-filter-bar">
          <button className="command-filter-chip" data-active="true" type="button">
            All Products
          </button>
          <button className="command-filter-chip" type="button">
            Rising
          </button>
          <button className="command-filter-chip" type="button">
            Watchlist
          </button>
        </div>

        <Link className="command-secondary-button" href={`/brands/${brandId}/opportunities`}>
          Flag Opportunity
        </Link>
      </section>

      <section className="commerce-table-shell">
        <div className="commerce-table-head commerce-product-head">
          <span>Product</span>
          <span>Revenue Share</span>
          <span>Conversion</span>
          <span>Margin</span>
          <span>Workflow Load</span>
          <span className="commerce-head-actions">Actions</span>
        </div>

        <div className="commerce-table-body">
          {products.map((product) => (
            <article key={product.id} className="commerce-row commerce-product-row">
              <div className="commerce-product-main">
                <p className="commerce-row-title">{product.title}</p>
                <p className="commerce-row-copy">{product.summary}</p>
                <div className="commerce-meta-row">
                  <span className="commerce-tag">{product.collection}</span>
                  <span className="commerce-tag" data-tone={product.status}>
                    {product.status}
                  </span>
                </div>
              </div>

              <div className="commerce-metric-cell">
                <strong>{product.revenueShare}</strong>
                <span>{product.revenueDelta}</span>
              </div>

              <div className="commerce-metric-cell">
                <strong>{product.conversionRate}</strong>
                <span>{product.conversionDelta}</span>
              </div>

              <div className="commerce-metric-cell">
                <strong>{product.marginBand}</strong>
                <span>{product.inventoryNote}</span>
              </div>

              <div className="commerce-metric-cell">
                <strong>{product.linkedOpportunityCount} opportunities</strong>
                <span>{product.linkedDraftCount} linked drafts</span>
              </div>

              <div className="commerce-actions-cell">
                <div className="commerce-row-actions">
                  <Link
                    className="command-inline-button"
                    href={`/brands/${brandId}/products/${product.id}`}
                  >
                    View Product
                  </Link>
                  <form
                    action={`/api/brands/${brandId}/products/${product.id}/generate-draft`}
                    className="inline-form"
                    method="post"
                  >
                    <button className="command-primary-button" type="submit">
                      Generate Hooks
                    </button>
                  </form>
                  <Link
                    className="command-secondary-button"
                    href={`/brands/${brandId}/opportunities`}
                  >
                    Flag Opportunity
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
