import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

// urls — one row per shortened link
export const urls = pgTable(
  "urls",
  {
    id: serial("id").primaryKey(),
    shortCode: varchar("short_code", { length: 12 }).notNull().unique(),
    originalUrl: text("original_url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // null = never expires
    expiresAt: timestamp("expires_at"),
    // Denormalized counter for cheap stats reads; incremented async on redirect
    clickCount: integer("click_count").default(0).notNull(),
  },
  (table) => ({
    // Hash index: O(1) lookup on the redirect hot path
    shortCodeIdx: index("urls_short_code_idx").on(table.shortCode),
  }),
);

// clicks — one row per redirect; used for analytics (referrers, time-series)
export const clicks = pgTable(
  "clicks",
  {
    id: serial("id").primaryKey(),
    urlId: integer("url_id")
      .notNull()
      .references(() => urls.id, { onDelete: "cascade" }),
    clickedAt: timestamp("clicked_at").defaultNow().notNull(),
    // varchar(45) is the maximum length of an IPv6 address
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    referrer: text("referrer"),
  },
  (table) => ({
    // Fast lookups when fetching stats for a specific URL
    urlIdIdx: index("clicks_url_id_idx").on(table.urlId),
    // Allows efficient time-series queries (e.g. clicks per day)
    clickedAtIdx: index("clicks_clicked_at_idx").on(table.clickedAt),
  }),
);

export type Url = typeof urls.$inferSelect;
export type NewUrl = typeof urls.$inferInsert;
export type Click = typeof clicks.$inferSelect;
export type NewClick = typeof clicks.$inferInsert;
