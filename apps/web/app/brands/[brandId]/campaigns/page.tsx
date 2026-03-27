import Link from "next/link";
import {
  getAcquisitionNarrative,
  listCampaignViewsAsync
} from "../../../../lib/acquisition-data";

type CampaignsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export default async function CampaignsPage({ params }: CampaignsPageProps) {
  const { brandId } = await params;
  const campaigns = await listCampaignViewsAsync(brandId);
  const featuredCampaigns = campaigns.slice(0, 3);

  return (
    <div className="commerce-suite">
      <header className="command-header">
        <div className="command-header-copy">
          <h1 className="command-title">Campaign Intelligence</h1>
          <p className="command-description">{getAcquisitionNarrative(brandId)}</p>
        </div>

        <div className="command-actions">
          <Link className="command-secondary-button" href={`/brands/${brandId}/reports`}>
            Export Campaign Data
          </Link>
          <Link className="command-primary-button" href={`/brands/${brandId}/content`}>
            Generate Content
          </Link>
        </div>
      </header>

      <section className="campaign-alert-grid">
        {featuredCampaigns.map((campaign) => (
          <article
            key={campaign.id}
            className="campaign-alert-card"
            data-tone={campaign.health}
          >
            <div className="campaign-alert-top">
              <span className="commerce-tag">{campaign.channelLabel}</span>
              <span className="commerce-tag" data-tone={campaign.health}>
                {campaign.health}
              </span>
            </div>
            <h3>{campaign.name}</h3>
            <p>{campaign.recommendation}</p>
          </article>
        ))}
      </section>

      <section className="commerce-table-shell">
        <div className="commerce-table-head campaign-table-head">
          <span>Campaign Name</span>
          <span>Channel</span>
          <span>Efficiency</span>
          <span>Status</span>
          <span>Asset Needs</span>
          <span className="commerce-head-actions">Actions</span>
        </div>

        <div className="commerce-table-body">
          {campaigns.map((campaign) => (
            <article id={campaign.id} key={campaign.id} className="commerce-row campaign-row">
              <div className="campaign-main">
                <p className="commerce-row-title">{campaign.name}</p>
                <p className="commerce-row-copy">{campaign.summary}</p>
              </div>

              <div className="commerce-metric-cell">
                <strong>{campaign.channelLabel}</strong>
                <span>{campaign.owner}</span>
              </div>

              <div className="commerce-metric-cell">
                <strong>{campaign.efficiency}</strong>
                <span>{campaign.outputChannel}</span>
              </div>

              <div className="commerce-metric-cell">
                <strong>{campaign.state.replaceAll("_", " ")}</strong>
                <span>{campaign.health}</span>
              </div>

              <div className="campaign-asset-needs">
                <p>{campaign.recommendation}</p>
              </div>

              <div className="commerce-actions-cell">
                <div className="commerce-row-actions">
                  <Link className="command-inline-button" href={`#${campaign.id}`}>
                    View Campaign
                  </Link>

                  {campaign.linkedDraftHref ? (
                    <Link className="command-primary-button" href={campaign.linkedDraftHref}>
                      Generate Content
                    </Link>
                  ) : (
                    <form
                      action={`/api/brands/${brandId}/campaigns/${campaign.id}/generate-draft`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/campaigns`} />
                      <button className="command-primary-button" type="submit">
                        Generate Content
                      </button>
                    </form>
                  )}

                  {campaign.state !== "flagged" ? (
                    <form
                      action={`/api/brands/${brandId}/campaigns/${campaign.id}/flag`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/campaigns`} />
                      <button className="command-secondary-button" type="submit">
                        Flag Issue
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
