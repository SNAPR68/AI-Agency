import Link from "next/link";
import {
  getAcquisitionNarrative,
  listChannelViewsAsync
} from "../../../../lib/acquisition-data";

type ChannelsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export default async function ChannelsPage({ params }: ChannelsPageProps) {
  const { brandId } = await params;
  const channels = await listChannelViewsAsync(brandId);
  const fragileChannel = channels.find((channel) => channel.health === "fragile");
  const scalingChannel = channels.find((channel) => channel.health === "scaling");

  return (
    <div className="commerce-suite">
      <header className="command-header">
        <div className="command-header-copy">
          <h1 className="command-title">Channel Performance</h1>
          <p className="command-description">{getAcquisitionNarrative(brandId)}</p>
        </div>

        <div className="command-actions">
          <Link className="command-secondary-button" href={`/brands/${brandId}/campaigns`}>
            View Campaigns
          </Link>
          <Link className="command-secondary-button" href={`/brands/${brandId}/reports`}>
            Export Channel Report
          </Link>
          <Link
            className="command-primary-button"
            href={`/brands/${brandId}/settings/integrations`}
          >
            Sync Channel Data
          </Link>
        </div>
      </header>

      <section className="channel-alert-grid">
        {fragileChannel ? (
          <article className="channel-alert-card" data-tone="danger">
            <div className="channel-alert-icon">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div>
              <h3>Anomaly detected in {fragileChannel.label}</h3>
              <p>{fragileChannel.nextMove}</p>
            </div>
          </article>
        ) : null}

        {scalingChannel ? (
          <article className="channel-alert-card" data-tone="positive">
            <div className="channel-alert-icon">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
              <h3>{scalingChannel.label} is over-indexing</h3>
              <p>{scalingChannel.summary}</p>
            </div>
          </article>
        ) : null}
      </section>

      <section className="channel-card-grid">
        {channels.map((channel) => (
          <article key={channel.id} className="channel-card">
            <div className="channel-card-head">
              <span className="commerce-tag">{channel.provider}</span>
              <span className="commerce-tag" data-tone={channel.health}>
                {channel.health}
              </span>
            </div>
            <h3>{channel.label}</h3>
            <div className="channel-card-metrics">
              <div>
                <span>Spend Share</span>
                <strong>{channel.spendShare}</strong>
              </div>
              <div>
                <span>Efficiency</span>
                <strong>{channel.efficiency}</strong>
              </div>
            </div>
            <p>{channel.trafficQuality}</p>
            <div className="commerce-row-actions">
              <Link className="command-inline-button" href={channel.campaignsHref}>
                View Campaigns
              </Link>
              {channel.state !== "investigating" ? (
                <form
                  action={`/api/brands/${brandId}/channels/${channel.id}/investigate`}
                  className="inline-form"
                  method="post"
                >
                  <input name="next" type="hidden" value={`/brands/${brandId}/channels`} />
                  <button className="command-primary-button" type="submit">
                    Investigate Drop
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
