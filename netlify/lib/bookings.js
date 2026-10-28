// Shared helpers for the booking functions (stored in Netlify Blobs).
//
// bookings/YYYY-MM-DD/<ref>               one record per booking
// claims/YYYY-MM-DD/<pro>/<HHMM>          one key per 15-minute block a booking occupies
//
// Claims are created with "only if new", which the storage applies atomically. Two overlapping
// bookings for the same professional always share at least one block (start times sit on the
// 15-minute grid), so only one of them can ever claim it: double bookings are impossible.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { BOOKING, PROFESSIONALS, SERVICES, addDays, fromMinutes, shopNow } from "../../public/shop-data.js";

export const store = () => getStore({ name: "bookings", consistency: "strong" });

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const findService = (id) => SERVICES.find((s) => s.id === id);
export const findPro = (id) => PROFESSIONALS.find((p) => p.id === id);

const isDateKey = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && addDays(value, 0) === value;
export { isDateKey };

// A date customers may book: today up to BOOKING.daysAhead - 1 days ahead (shop time).
export function isBookableDate(dateKey) {
  if (!isDateKey(dateKey)) return false;
  const today = shopNow().dateKey;
  return dateKey >= today && dateKey <= addDays(today, BOOKING.daysAhead - 1);
}

// All bookings (including cancelled) for one day.
export async function listDay(dateKey) {
  const s = store();
  const { blobs } = await s.list({ prefix: `bookings/${dateKey}/` });
  const items = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json", consistency: "strong" })));
  return items.filter(Boolean);
}

export const bookingKey = (date, ref) => `bookings/${date}/${ref}`;

export async function getBooking(date, ref) {
  return store().get(bookingKey(date, ref), { type: "json", consistency: "strong" });
}

export async function saveBooking(booking, { onlyIfNew = false } = {}) {
  const result = await store().setJSON(bookingKey(booking.date, booking.ref), booking, onlyIfNew ? { onlyIfNew: true } : {});
  return result.modified;
}

const blocksFor = (start, end) => {
  const blocks = [];
  for (let b = start; b < end; b += BOOKING.slotMinutes) blocks.push(b);
  return blocks;
};
const claimKey = (date, proId, mins) => `claims/${date}/${proId}/${fromMinutes(mins).replace(":", "")}`;

// Claims every block of [start, end) for a professional. All or nothing: on any clash the
// blocks claimed so far are released and false is returned.
export async function claimSlot(date, proId, start, end, ref) {
  const s = store();
  const claimed = [];
  for (const block of blocksFor(start, end)) {
    const key = claimKey(date, proId, block);
    const { modified } = await s.setJSON(key, { ref }, { onlyIfNew: true });
    if (!modified) {
      await Promise.all(claimed.map((k) => s.delete(k)));
      return false;
    }
    claimed.push(key);
  }
  return true;
}

// Frees the blocks held by a booking (only the ones it actually owns).
export async function releaseSlot(date, proId, start, end, ref) {
  const s = store();
  await Promise.all(
    blocksFor(start, end).map(async (block) => {
      const key = claimKey(date, proId, block);
      const claim = await s.get(key, { type: "json", consistency: "strong" });
      if (claim?.ref === ref) await s.delete(key);
    })
  );
}

export const newReference = () => `CC-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;

// Removes control characters and trims free text from customers.
export const cleanText = (value, max) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

// Only accept browser requests coming from this site.
export function sameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

// Staff requests carry "Authorization: Bearer <ADMIN_KEY>".
export function isAdmin(req) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return false;
  const given = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return given.length > 0 && timingSafeEqual(a, b);
}

// Best-effort limit on booking attempts per visitor (IP is hashed, never stored as-is).
export async function tooManyAttempts(ip, limit = 30, windowMs = 60 * 60 * 1000) {
  if (!ip) return false;
  const key = `rate/${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
  const now = Date.now();
  const s = store();
  const recent = ((await s.get(key, { type: "json" })) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return true;
  recent.push(now);
  await s.setJSON(key, recent);
  return false;
}
