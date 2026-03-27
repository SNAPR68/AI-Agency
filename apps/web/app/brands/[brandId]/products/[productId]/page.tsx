import Link from "next/link";
import { getBrandProductDetailAsync } from "../../../../../lib/growth-workflow-data";

type ProductDetailPageProps = {
  params: Promise<{
    brandId: string;
    productId: string;
  }>;
};

export default async function ProductDetailPage({
  params
}: ProductDetailPageProps) {
  const { brandId, productId } = await params;
  const product = await getBrandProductDetailAsync(brandId, productId);

  if (!product) {
    return (
      <div className="commerce-suite">
        <header className="command-header">
          <div className="command-header-copy">
            <p className="command-kicker">Product Detail</p>
            <h1 className="command-title">Product not found</h1>
            <p className="command-description">
              This product is not available in the current workflow dataset yet.
            </p>
          </div>
          <Link className="command-primary-button" href={`/brands/${brandId}/products`}>
            Back to Products
          </Link>
        </header>
      </div>
    );
  }

  return (
    <div className="product-story-page">
      <header className="product-story-header">
        <div className="product-story-copy">
          <div className="product-story-meta">
            <span className="commerce-tag">{product.status} growth sku</span>
            <span className="product-story-sync">Last synced moments ago</span>
          </div>
          <h1 className="product-story-title">{product.title}</h1>
          <p className="product-story-description">{product.summary}</p>
        </div>

        <div className="product-story-actions">
          <form
            action={`/api/brands/${brandId}/products/${product.id}/generate-draft`}
            className="inline-form"
            method="post"
          >
            <button className="command-primary-button" type="submit">
              Generate Hooks
            </button>
          </form>
          <Link className="command-secondary-button" href={`/brands/${brandId}/content`}>
            Create Brief
          </Link>
          <Link
            className="command-secondary-button"
            href={`/brands/${brandId}/content/calendar`}
          >
            Add to Content Plan
          </Link>
          <Link className="command-secondary-button" href={`/brands/${brandId}/opportunities`}>
            Mark Priority
          </Link>
        </div>
      </header>

      <section className="product-story-grid">
        <div className="product-visual-card">
          <div className="product-visual-badge">SKU {product.id.replace("prod-", "").toUpperCase()}</div>
          <div className="product-visual-art">{product.title.slice(0, 2).toUpperCase()}</div>
          <div className="product-visual-footer">
            <span>{product.collection}</span>
            <span>{product.status}</span>
          </div>
        </div>

        <div className="product-stat-stack">
          <article className="product-stat-card">
            <span>Revenue Share</span>
            <strong>{product.revenueShare}</strong>
            <p>{product.revenueDelta}</p>
          </article>
          <article className="product-stat-card">
            <span>Conversion</span>
            <strong>{product.conversionRate}</strong>
            <p>{product.conversionDelta}</p>
          </article>
          <article className="product-stat-card">
            <span>Margin</span>
            <strong>{product.marginBand}</strong>
            <p>{product.inventoryNote}</p>
          </article>
        </div>
      </section>

      <section className="product-detail-grid">
        <article className="product-detail-card product-detail-card-wide">
          <p className="command-mini-kicker">Strategic Read</p>
          <h2>{product.heroMessage}</h2>
          <p>{product.narrative}</p>
          <div className="product-signal-bars">
            <div className="product-signal-bar">
              <span>Revenue Momentum</span>
              <div>
                <i style={{ width: `${Math.min(92, Math.max(28, parseInt(product.revenueShare, 10) * 2))}%` }} />
              </div>
            </div>
            <div className="product-signal-bar">
              <span>Conversion Strength</span>
              <div>
                <i style={{ width: `${Math.min(90, Math.max(22, parseInt(product.conversionRate, 10) * 18))}%` }} />
              </div>
            </div>
          </div>
        </article>

        <article className="product-detail-card">
          <p className="command-mini-kicker">Watchout</p>
          <h2>Commercial Risk</h2>
          <p>{product.watchout}</p>
        </article>

        <article className="product-detail-card product-detail-card-wide">
          <p className="command-mini-kicker">Linked Opportunities</p>
          <div className="product-linked-list">
            {product.opportunities.map((opportunity) => (
              <div key={opportunity.id} className="product-linked-item">
                <div>
                  <h3>{opportunity.title}</h3>
                  <p>{opportunity.recommendation}</p>
                </div>
                <div className="product-linked-actions">
                  <span className="commerce-tag" data-tone={opportunity.status}>
                    {opportunity.status}
                  </span>
                  {opportunity.linkedDraftHref ? (
                    <Link className="command-inline-button" href={opportunity.linkedDraftHref}>
                      Open Draft
                    </Link>
                  ) : (
                    <form
                      action={`/api/brands/${brandId}/opportunities/${opportunity.id}/generate-draft`}
                      className="inline-form"
                      method="post"
                    >
                      <button className="command-inline-button" type="submit">
                        Create Brief
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="product-detail-card">
          <p className="command-mini-kicker">Formats</p>
          <h2>Recommended formats</h2>
          <div className="product-format-list">
            {product.recommendedFormats.map((format) => (
              <span key={format} className="commerce-tag">
                {format}
              </span>
            ))}
          </div>
        </article>

        <article className="product-detail-card product-detail-card-wide">
          <p className="command-mini-kicker">Drafts In Motion</p>
          <div className="product-linked-list">
            {product.drafts.map((draft) => (
              <div key={draft.id} className="product-linked-item">
                <div>
                  <h3>{draft.title}</h3>
                  <p>{draft.hook}</p>
                </div>
                <div className="product-linked-actions">
                  <span className="commerce-tag">{draft.status.replaceAll("_", " ")}</span>
                  <Link className="command-inline-button" href={draft.href}>
                    Add to Content Plan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
