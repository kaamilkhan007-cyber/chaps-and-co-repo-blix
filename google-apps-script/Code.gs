// Chaps & Co: adds website bookings to this Google account's calendar.
//
// Setup (while signed in to the calendar's Google account):
//   1. script.google.com > New project, paste this file, and set SECRET below.
//   2. Pick "authorize" in the function menu and press Run, then allow calendar access.
//   3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
//   4. Put the web app URL (ends in /exec) and SECRET in Netlify as
//      GCAL_WEBHOOK_URL and GCAL_WEBHOOK_SECRET, then redeploy the site.
//
// Only requests that carry SECRET can create or delete events.

const SECRET = "PASTE_SECRET_HERE";
const CALENDAR_ID = "primary"; // "primary" = this account's main calendar, or paste another calendar's ID
const REMINDER_MINUTES = 30;

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "bad_json" });
  }
  if (!body || SECRET === "PASTE_SECRET_HERE" || body.secret !== SECRET) {
    return reply({ ok: false, error: "unauthorized" });
  }

  const calendar = CALENDAR_ID === "primary" ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(CALENDAR_ID);

  if (body.action === "create") {
    const start = new Date(body.start);
    const end = new Date(body.end);
    if (isNaN(start) || isNaN(end) || end <= start) return reply({ ok: false, error: "bad_time" });

    const event = calendar.createEvent(String(body.title || "Booking").slice(0, 200), start, end, {
      description: String(body.description || "").slice(0, 4000),
      location: String(body.location || "").slice(0, 300),
    });
    event.removeAllReminders();
    event.addPopupReminder(REMINDER_MINUTES);
    return reply({ ok: true, eventId: event.getId() });
  }

  if (body.action === "cancel") {
    const event = calendar.getEventById(String(body.eventId || ""));
    if (event) event.deleteEvent();
    return reply({ ok: true });
  }

  return reply({ ok: false, error: "unknown_action" });
}

function doGet() {
  return reply({ ok: true, service: "Chaps & Co calendar sync" });
}

function reply(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the editor so Google asks for permission to use the calendar.
function authorize() {
  CalendarApp.getDefaultCalendar().getName();
}
