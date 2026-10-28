// POST /api/admin/cancel  { date, ref }   (staff only)
// Marks a booking as cancelled and frees its time for other customers.
import { getBooking, isAdmin, isDateKey, json, releaseSlot, sameOrigin, saveBooking } from "../lib/bookings.js";
import { removeFromCalendar } from "../lib/calendar.js";

export default async (req, context) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!sameOrigin(req)) return json(403, { error: "forbidden" });
  if (!process.env.ADMIN_KEY) return json(503, { error: "not_configured", message: "ADMIN_KEY is not set on Netlify." });
  if (!isAdmin(req)) return json(401, { error: "unauthorized", message: "Wrong admin password." });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "bad_request" });
  }
  const { date, ref } = body || {};
  if (!isDateKey(date) || typeof ref !== "string" || !/^CC-[0-9A-F]{6}$/.test(ref)) return json(400, { error: "bad_request" });

  try {
    const booking = await getBooking(date, ref);
    if (!booking) return json(404, { error: "not_found", message: "Booking not found." });
    const wasCancelled = booking.status === "cancelled";

    if (booking.status !== "cancelled") {
      booking.status = "cancelled";
      booking.cancelledAt = new Date().toISOString();
      await saveBooking(booking);
    }
    await releaseSlot(date, booking.proId, booking.start, booking.end, booking.ref);

    // Remove the Google Calendar event in the background
    const calendarTask = (wasCancelled ? Promise.resolve() : removeFromCalendar(booking.calendarEventId)).catch((error) =>
      console.error("calendar cancel failed", booking.ref, error)
    );
    if (typeof context?.waitUntil === "function") context.waitUntil(calendarTask);
    else await calendarTask;

    return json(200, { ok: true, booking });
  } catch (error) {
    console.error("admin cancel failed", error);
    return json(503, { error: "unavailable", message: "Couldn't cancel. Please try again." });
  }
};

export const config = { path: "/api/admin/cancel" };
