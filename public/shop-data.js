// Shop details shared by the website and the booking server (netlify/functions).
// Edit services, prices, barbers or hours here and both stay in sync.

export const SHOP = {
  name: "Chaps & Co Barbers",
  phoneDisplay: "084 217 7323",
  phoneLink: "tel:+27842177323",
  whatsapp: "27842177323", // international format, digits only
  timeZone: "Africa/Johannesburg",
  // Google Maps pin on Jewel Beetle Street, Raslouw (City of Tshwane, 0157)
  mapEmbed: "https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s-25.855316,28.110067!6i16",
};

// Trading hours. 0 = Sunday ... 6 = Saturday. [opens, closes] in 24-hour time, or null if closed.
export const HOURS = {
  0: ["08:00", "19:30"],
  1: ["09:00", "19:00"],
  2: ["08:00", "19:30"],
  3: ["08:00", "19:30"],
  4: ["08:00", "19:30"],
  5: ["08:00", "19:30"],
  6: ["08:00", "19:30"],
};

export const BOOKING = {
  slotMinutes: 15, // start times are offered every 15 minutes
  daysAhead: 14, // how far ahead customers can book
  leadMinutes: 30, // earliest booking today is this many minutes from now
  defaultServiceId: "haircut",
};

export const CATEGORIES = [
  { id: "popular", name: "Popular" },
  { id: "haircuts", name: "Haircuts" },
  { id: "colour", name: "Colour" },
  { id: "beard", name: "Beard & Shave" },
  { id: "waxing", name: "Waxing" },
  { id: "therapy", name: "Therapy" },
];

export const SERVICES = [
  { id: "haircut", name: "Haircut", mins: 20, price: 160, cats: ["popular", "haircuts"] },
  { id: "haircut-shave", name: "Haircut & Shave", mins: 60, price: 300, cats: ["popular", "haircuts", "beard"] },
  { id: "haircut-wash-style", name: "Haircut, Wash & Style", mins: 60, price: 350, cats: ["haircuts"] },
  { id: "senior-haircut", name: "Senior Haircut (gents 65+)", mins: 20, price: 100, cats: ["haircuts"] },
  { id: "womens-haircut", name: "Women's Haircut", mins: 80, price: 550, cats: ["popular", "haircuts"] },
  { id: "hair-colour", name: "Hair Colour (gents)", mins: 25, price: 150, cats: ["popular", "colour"] },
  { id: "haircut-colour-wash", name: "Haircut, Colour & Wash", mins: 60, price: 350, cats: ["colour"] },
  { id: "beard-trim", name: "Beard Trim & Shape", mins: 20, price: 140, cats: ["popular", "beard"] },
  { id: "hot-towel-shave", name: "Hot Towel Clean Shave", mins: 20, price: 120, cats: ["beard"] },
  { id: "nose-wax", name: "Nose Wax", mins: 15, price: 50, cats: ["waxing"] },
  { id: "ear-wax", name: "Ear Wax", mins: 15, price: 50, cats: ["waxing"] },
  { id: "cheeks-wax", name: "Cheeks Wax", mins: 15, price: 50, cats: ["waxing"] },
  { id: "massage", name: "Holistic Healing Massage", mins: 60, price: 350, cats: ["popular", "therapy"] },
];

// Every professional takes one booking at a time during trading hours.
export const PROFESSIONALS = [
  { id: "mohammed", name: "Mohammed", role: "Owner", photo: "images/mohammed.jpg" },
  { id: "papu", name: "Papu", role: "Big Boss" },
  { id: "ahmad", name: "Ahmad", role: "Barber" },
];

// Laser hair removal by Metro Smooth at Chaps & Co (Raslouw Corner).
// Booked directly with Metro Smooth, not through the barber booking system.
export const LASER = {
  provider: "Metro Smooth",
  tagline: "Precision laser for men",
  promise: "Discreet. Professional. Proven results.",
  phoneDisplay: "060 786 6387",
  phoneLink: "tel:+27607866387",
  whatsapp: "27607866387",
  instagram: "metrosmoooth",
  treatments: [
    { name: "Beard line", detail: "Above cheek line", price: 150 },
    { name: "Neck", detail: "Around Adam's apple till beard", price: 100 },
    { name: "Nape", detail: "Back of neck & hairline", price: 100 },
    { name: "Ears", price: 150 },
    { name: "Between brows", price: 80 },
    { name: "Underarms", price: 250 },
    { name: "Shoulders", price: 200 },
    { name: "Half arms", price: 400 },
    { name: "Full arms", price: 600 },
    { name: "Fingers", price: 100 },
    { name: "Chest", price: 350 },
    { name: "Abdomen", price: 350 },
    { name: "Belly line", detail: "Till above abdominal bone", price: 200 },
    { name: "Upper back", price: 350 },
    { name: "Lower back", price: 350 },
    { name: "Full back", price: 600 },
    { name: "Half leg", price: 500 },
    { name: "Full leg", price: 900 },
    { name: "Toes", price: 100 },
  ],
  combos: [
    { name: "Metro Precision", detail: "Beard line, neck, nape & underarms", price: 450 },
    { name: "Chest & abdomen", price: 600 },
    { name: "Half arms, half leg & underarms", price: 900 },
    { name: "Full legs & underarms", price: 900 },
    { name: "Back, chest & underarms", price: 900 },
    { name: "Full arms & full legs", price: 1200 },
    { name: "Metro Sleek", detail: "Beard line, neck, nape, ears, underarms, shoulders, chest & full arms", price: 1200 },
    { name: "Metro Platinum", detail: "Full body, excluding bikini & buttocks", price: 2000 },
  ],
};

export const DAY_NAMES =["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

// Today's date (YYYY-MM-DD), weekday and minutes past midnight at the shop, in any time zone.
export function shopNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: SHOP.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday),
    mins: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

// Date helpers on plain YYYY-MM-DD keys (no time zone surprises)
export function addDays(dateKey, n) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

export function weekdayOf(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// Bookable start times for a service on a day, with which professionals are free at each.
// `bookings` are that day's existing bookings: { proId, start, end, status } in minutes.
export function daySlots(dateKey, service, bookings, now = shopNow()) {
  const hours = HOURS[weekdayOf(dateKey)];
  if (!hours) return [];

  const open = toMinutes(hours[0]);
  const lastStart = toMinutes(hours[1]) - service.mins;
  const earliest = dateKey === now.dateKey ? now.mins + BOOKING.leadMinutes : -Infinity;
  const active = bookings.filter((b) => b.status !== "cancelled");

  const slots = [];
  for (let start = open; start <= lastStart; start += BOOKING.slotMinutes) {
    const end = start + service.mins;
    const free =
      start < earliest
        ? []
        : PROFESSIONALS.filter((p) => !active.some((b) => b.proId === p.id && b.start < end && start < b.end)).map(
            (p) => p.id
          );
    slots.push({ time: fromMinutes(start), free, past: start < earliest });
  }
  return slots;
}
