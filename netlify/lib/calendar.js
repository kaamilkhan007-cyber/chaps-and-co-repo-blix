// Sends bookings to Google Calendar through a Google Apps Script web app that runs in the
// calendar owner's Google account (see google-apps-script/Code.gs).
//
// Netlify environment variables:
//   GCAL_WEBHOOK_URL     the web app's ".../exec" URL
//   GCAL_WEBHOOK_SECRET  the same secret that is written in the script
//
// If they're not set, calendar sync is skipped. A calendar failure never affects the booking.
import { SHOP } from "../../public/shop-data.js";

const TIMEOUT_MS = 10000;

export const calendarConfigured = () => Boolean(process.env.GCAL_WEBHOOK_URL && process.env.GCAL_WEBHOOK_SECRET);

async function callScript(payload) {
  const response = await fetch(process.env.GCAL_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: process.env.GCAL_WEBHOOK_SECRET, ...payload }),
    redirect: "follow", // Apps Script answers via a redirect to googleusercontent.com
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(`calendar script error: ${response.status} ${data.error || ""}`.trim());
  return data;
}

// Shop time is South African Standard Time (UTC+2, no daylight saving).
const isoAtShop = (date, mins) =>
  `${date}T${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}:00+02:00`;

// Creates the event and returns its Google Calendar event ID (or null if sync is off).
export async function addToCalendar(booking) {
  if (!calendarConfigured()) return null;
  const description = [
    `Booking reference: ${booking.ref}`,
    `Service: ${booking.serviceName} (R${booking.price})`,
    `Professional: ${booking.proName}${booking.anyPro ? " (customer chose any professional)" : ""}`,
    `Customer: ${booking.name}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email}`,
    booking.note ? `Note: ${booking.note}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const data = await callScript({
    action: "create",
    title: `${booking.serviceName} – ${booking.name} (${booking.proName})`,
    start: isoAtShop(booking.date, booking.start),
    end: isoAtShop(booking.date, booking.end),
    location: `${SHOP.name}, Jewel Beetle Street, Raslouw, City of Tshwane, 0157`,
    description,
  });
  return data.eventId || null;
}

export async function removeFromCalendar(eventId) {
  if (!calendarConfigured() || !eventId) return;
  await callScript({ action: "cancel", eventId });
}
