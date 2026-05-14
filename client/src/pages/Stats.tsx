import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getStats, type StatsResponse } from "../api";
import { StatsChart } from "../components/StatsChart";

export function Stats() {
  const { code } = useParams<{ code: string }>();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    getStats(code)
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load stats."),
      )
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <p className="stats__loading">Loading stats…</p>;
  if (error)
    return (
      <p className="stats__error" role="alert">
        {error}
      </p>
    );
  if (!stats) return null;

  return (
    <main className="stats">
      <Link className="stats__back" to="/">
        ← Shorten another URL
      </Link>

      <h1 className="stats__title">/{stats.shortCode}</h1>
      <p className="stats__original" title={stats.originalUrl}>
        {stats.originalUrl}
      </p>

      <div className="stats__cards">
        <div className="stats__card">
          <span className="stats__card-value">
            {stats.clickCount.toLocaleString()}
          </span>
          <span className="stats__card-label">Total clicks</span>
        </div>
        <div className="stats__card">
          <span className="stats__card-value">
            {new Date(stats.createdAt).toLocaleDateString()}
          </span>
          <span className="stats__card-label">Created</span>
        </div>
        <div className="stats__card">
          <span className="stats__card-value">
            {stats.expiresAt
              ? new Date(stats.expiresAt).toLocaleDateString()
              : "Never"}
          </span>
          <span className="stats__card-label">Expires</span>
        </div>
      </div>

      <StatsChart data={stats.clicksPerDay} />

      {stats.topReferrers.length > 0 && (
        <section className="stats__referrers">
          <h2>Top referrers</h2>
          <ol className="stats__referrer-list">
            {stats.topReferrers.map((r, i) => (
              <li key={i} className="stats__referrer-item">
                <span className="stats__referrer-name">
                  {r.referrer ?? "Direct / Unknown"}
                </span>
                <span className="stats__referrer-count">{r.count}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
