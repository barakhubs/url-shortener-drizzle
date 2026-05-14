import { eq, sql, desc, count } from "drizzle-orm";
import { db } from "../db";
import { urls, clicks, type Url } from "../db/schema";
import { generateShortCode } from "./shortCode";

// Maximum retries if a generated short code collides with an existing one.
// At < 100M URLs the probability of a collision is negligible, but we handle it gracefully.
const MAX_COLLISION_RETRIES = 3;

export async function createShortUrl(originalUrl: string): Promise<Url> {
  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
    const shortCode = generateShortCode();
    try {
      const [created] = await db
        .insert(urls)
        .values({ shortCode, originalUrl })
        .returning();
      return created;
    } catch (err: unknown) {
      // Postgres unique violation code is 23505.
      // On any other error, rethrow immediately.
      if (!isUniqueViolation(err) || attempt === MAX_COLLISION_RETRIES - 1) {
        throw err;
      }
      // Short code collision — try again with a new code
    }
  }
  // TypeScript requires a return here; the loop above always returns or throws
  throw new Error("Failed to generate a unique short code");
}

export async function findByCode(shortCode: string): Promise<Url | null> {
  const result = await db
    .select()
    .from(urls)
    .where(eq(urls.shortCode, shortCode))
    .limit(1);
  return result[0] ?? null;
}

// Fire-and-forget: called without await on the redirect hot path.
// A failure here must never crash the server or delay the redirect.
export async function recordClick(
  urlId: number,
  data: { ipAddress?: string; userAgent?: string; referrer?: string },
): Promise<void> {
  await Promise.all([
    db.insert(clicks).values({ urlId, ...data }),
    db
      .update(urls)
      .set({ clickCount: sql`${urls.clickCount} + 1` })
      .where(eq(urls.id, urlId)),
  ]);
}

export interface UrlStats {
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  createdAt: Date;
  expiresAt: Date | null;
  topReferrers: Array<{ referrer: string | null; count: number }>;
  clicksPerDay: Array<{ date: string; count: number }>;
}

export async function getStats(shortCode: string): Promise<UrlStats | null> {
  const url = await findByCode(shortCode);
  if (!url) return null;

  const [topReferrers, clicksPerDay] = await Promise.all([
    // Top 5 referrers by click count
    db
      .select({ referrer: clicks.referrer, count: count() })
      .from(clicks)
      .where(eq(clicks.urlId, url.id))
      .groupBy(clicks.referrer)
      .orderBy(desc(count()))
      .limit(5),

    // Clicks aggregated by day for the last 30 days
    db.execute(sql`
      SELECT
        TO_CHAR(clicked_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count
      FROM clicks
      WHERE url_id = ${url.id}
        AND clicked_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `),
  ]);

  return {
    shortCode: url.shortCode,
    originalUrl: url.originalUrl,
    clickCount: url.clickCount,
    createdAt: url.createdAt,
    expiresAt: url.expiresAt,
    topReferrers: topReferrers.map((r) => ({
      referrer: r.referrer,
      count: Number(r.count),
    })),
    clicksPerDay: (
      clicksPerDay as unknown as Array<{ date: string; count: number }>
    ).map((r) => ({ date: r.date, count: Number(r.count) })),
  };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}
