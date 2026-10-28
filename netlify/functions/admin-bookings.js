// GET /api/admin/bookings?from=YYYY-MM-DD&days=14   (staff only)
import { addDays, shopNow } from "../../public/shop-data.js";
import { isAdmin, isDateKey, json, listDay } from "../lib/bookings.js";
import { calendarConfigured } from "../lib/calendar.js";

export default async (req) => {
  if (req.method !== "GET") return json(405, { error: "method_not_allowed" });
  if (!process.env.ADMIN_KEY) return json(503, { error: "not_configured", message: "ADMIN_KEY is not set on Netlify." });
  if (!isAdmin(req)) return json(401, { error: "unauthorized", message: "Wrong admin password." });

  const url = new URL(req.url);
  const requested = url.searchParams.get("from");
  const from = isDateKey(requested) ? requested : shopNow().dateKey;
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 14, 1), 31);

  try {
    const dates = Array.from({ length: days }, (_, i) => addDays(from, i));
    const lists = await Promise.all(dates.map((date) => listDay(date)));
    return json(200, {
      from,
      calendar: calendarConfigured(),
      days: dates.map((date, i) => ({ date, bookings: lists[i].sort((a, b) => a.start - b.start) })),
    });
  } catch (error) {
    console.error("admin list failed", error);
    return json(503, { error: "unavailable", message: "Couldn't load bookings. Please try again." });
  }
};

export const config = { path: "/api/admin/bookings" };
