// POST /api/book  { service, pro, date, time, name, phone, note }
// Re-checks the time on the server and claims it atomically before saving,
// so a professional can only ever be booked once for any given time.
import { PROFESSIONALS, daySlots, toMinutes } from "../../public/shop-data.js";
import { addToCalendar, removeFromCalendar } from "../lib/calendar.js";
import {
  claimSlot,
  cleanText,
  findPro,
  findService,
  getBooking,
  isBookableDate,
  json,
  listDay,
  newReference,
  releaseSlot,
  sameOrigin,
  saveBooking,
  tooManyAttempts,
} from "../lib/bookings.js";

const fail = (message) => json(400, { error: "bad_request", message });

export default async (req, context) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!sameOrigin(req)) return json(403, { error: "forbidden" });

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Something went wrong. Please try again.");
  }
  if (!body || typeof body !== "object") return fail("Something went wrong. Please try again.");

  // Hidden form field that people never fill in, but spam bots do
  if (body.company) return fail("Something went wrong. Please try again.");

  const service = findService(body.service);
  const wantsAny = body.pro === "any";
  const pro = wantsAny ? null : findPro(body.pro);
  const date = body.date;
  const time = typeof body.time === "string" && /^\d{2}:\d{2}$/.test(body.time) ? body.time : null;
  const name = cleanText(body.name, 60);
  const phone = cleanText(body.phone, 20);
  const email = cleanText(body.email, 100).toLowerCase();
  const note = cleanText(body.note, 300);

  if (!service) return fail("Please choose a service.");
  if (!wantsAny && !pro) return fail("Please choose a professional.");
  if (!isBookableDate(date) || !time) return fail("Please choose a valid date and time.");
  if (name.length < 2) return fail("Please enter your name.");
  if (!/^[0-9 +()-]{9,20}$/.test(phone) || phone.replace(/\D/g, "").length < 9) {
    return fail("Please enter a valid phone number.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Please enter a valid email address.");

  try {
    if (await tooManyAttempts(context.ip)) {
      return json(429, { error: "rate_limited", message: "Too many booking attempts. Please call us to book." });
    }

    const bookings = (await listDay(date)).filter((b) => b.status !== "cancelled");
    const slot = daySlots(date, service, bookings).find((s) => s.time === time && !s.past);
    if (!slot) return fail("That time isn't available for this service.");

    // Same phone number can't hold two bookings at the same start time
    const digits = phone.replace(/\D/g, "");
    if (bookings.some((b) => b.phone.replace(/\D/g, "") === digits && b.time === time)) {
      return json(409, { error: "duplicate", message: "You already have a booking at this time." });
    }

    // "Any professional": try whoever is free, least busy first
    const load = (id) => bookings.filter((b) => b.proId === id).length;
    const candidates = wantsAny
      ? PROFESSIONALS.filter((p) => slot.free.includes(p.id)).sort((a, b) => load(a.id) - load(b.id))
      : slot.free.includes(pro.id)
        ? [pro]
        : [];

    const start = toMinutes(time);
    const end = start + service.mins;

    for (const chosen of candidates) {
      const ref = newReference();
      if (!(await claimSlot(date, chosen.id, start, end, ref))) continue; // someone just took it

      const booking = {
        ref,
        service: service.id,
        serviceName: service.name,
        price: service.price,
        proId: chosen.id,
        proName: chosen.name,
        anyPro: wantsAny,
        date,
        time,
        start,
        end,
        name,
        phone,
        email,
        note,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };

      try {
        if (!(await saveBooking(booking, { onlyIfNew: true }))) throw new Error("reference already used");
      } catch (error) {
        await releaseSlot(date, chosen.id, start, end, ref);
        throw error;
      }

      // Add to Google Calendar after replying, so the customer never waits on Google.
      // The event ID is saved on the booking so a cancellation can remove the event.
      const calendarTask = addToCalendar(booking)
        .then(async (eventId) => {
          if (!eventId) return;
          const current = await getBooking(date, booking.ref); // staff may have cancelled meanwhile
          if (!current) return;
          await saveBooking({ ...current, calendarEventId: eventId });
          if (current.status === "cancelled") await removeFromCalendar(eventId);
        })
        .catch((error) => console.error("calendar sync failed", booking.ref, error));
      if (typeof context.waitUntil === "function") context.waitUntil(calendarTask);
      else await calendarTask;

      const { phone: _phone, note: _note, email: _email, ...publicBooking } = booking;
      return json(201, { ok: true, booking: publicBooking });
    }

    return json(409, { error: "slot_taken", message: "Sorry, that time has just been booked. Please choose another time." });
  } catch (error) {
    console.error("booking failed", error);
    return json(503, { error: "unavailable", message: "We couldn't save your booking. Please try again or call us." });
  }
};

export const config = { path: "/api/book" };
