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
  { id: "laser-treatments", name: "Laser treatments", laser: true },
  { id: "laser-combos", name: "Laser combos", laser: true },
];

// `provider` says who does the service: "barber" (default) or "laser" (Metro Smooth).
const barber = (s) => ({ provider: "barber", ...s });
// Laser durations are estimates for the booking calendar; adjust them to Metro Smooth's real times.
const laser = (cat) => (s) => ({ provider: "laser", cats: [cat], ...s });
const treatment = laser("laser-treatments");
const combo = laser("laser-combos");

export const SERVICES = [
  barber({ id: "haircut", name: "Haircut", mins: 20, price: 160, cats: ["popular", "haircuts"] }),
  barber({ id: "haircut-shave", name: "Haircut & Shave", mins: 60, price: 300, cats: ["popular", "haircuts", "beard"] }),
  barber({ id: "haircut-wash-style", name: "Haircut, Wash & Style", mins: 60, price: 350, cats: ["haircuts"] }),
  barber({ id: "senior-haircut", name: "Senior Haircut (gents 65+)", mins: 20, price: 100, cats: ["haircuts"] }),
  barber({ id: "womens-haircut", name: "Women's Haircut", mins: 80, price: 550, cats: ["popular", "haircuts"] }),
  barber({ id: "hair-colour", name: "Hair Colour (gents)", mins: 25, price: 150, cats: ["popular", "colour"] }),
  barber({ id: "haircut-colour-wash", name: "Haircut, Colour & Wash", mins: 60, price: 350, cats: ["colour"] }),
  barber({ id: "beard-trim", name: "Beard Trim & Shape", mins: 20, price: 140, cats: ["popular", "beard"] }),
  barber({ id: "hot-towel-shave", name: "Hot Towel Clean Shave", mins: 20, price: 120, cats: ["beard"] }),
  barber({ id: "nose-wax", name: "Nose Wax", mins: 15, price: 50, cats: ["waxing"] }),
  barber({ id: "ear-wax", name: "Ear Wax", mins: 15, price: 50, cats: ["waxing"] }),
  barber({ id: "cheeks-wax", name: "Cheeks Wax", mins: 15, price: 50, cats: ["waxing"] }),
  barber({ id: "massage", name: "Holistic Healing Massage", mins: 60, price: 350, cats: ["popular", "therapy"] }),

  // Laser hair removal (Metro Smooth): treatments
  treatment({ id: "laser-beard-line", name: "Laser: Beard line", short: "Beard line", detail: "Above cheek line", mins: 20, price: 150 }),
  treatment({ id: "laser-neck", name: "Laser: Neck", short: "Neck", detail: "Around Adam's apple till beard", mins: 15, price: 100 }),
  treatment({ id: "laser-nape", name: "Laser: Nape", short: "Nape", detail: "Back of neck & hairline", mins: 15, price: 100 }),
  treatment({ id: "laser-ears", name: "Laser: Ears", short: "Ears", mins: 15, price: 150 }),
  treatment({ id: "laser-between-brows", name: "Laser: Between brows", short: "Between brows", mins: 15, price: 80 }),
  treatment({ id: "laser-underarms", name: "Laser: Underarms", short: "Underarms", mins: 20, price: 250 }),
  treatment({ id: "laser-shoulders", name: "Laser: Shoulders", short: "Shoulders", mins: 20, price: 200 }),
  treatment({ id: "laser-half-arms", name: "Laser: Half arms", short: "Half arms", mins: 30, price: 400 }),
  treatment({ id: "laser-full-arms", name: "Laser: Full arms", short: "Full arms", mins: 45, price: 600 }),
  treatment({ id: "laser-fingers", name: "Laser: Fingers", short: "Fingers", mins: 15, price: 100 }),
  treatment({ id: "laser-chest", name: "Laser: Chest", short: "Chest", mins: 30, price: 350 }),
  treatment({ id: "laser-abdomen", name: "Laser: Abdomen", short: "Abdomen", mins: 30, price: 350 }),
  treatment({ id: "laser-belly-line", name: "Laser: Belly line", short: "Belly line", detail: "Till above abdominal bone", mins: 15, price: 200 }),
  treatment({ id: "laser-upper-back", name: "Laser: Upper back", short: "Upper back", mins: 30, price: 350 }),
  treatment({ id: "laser-lower-back", name: "Laser: Lower back", short: "Lower back", mins: 30, price: 350 }),
  treatment({ id: "laser-full-back", name: "Laser: Full back", short: "Full back", mins: 45, price: 600 }),
  treatment({ id: "laser-half-leg", name: "Laser: Half leg", short: "Half leg", mins: 40, price: 500 }),
  treatment({ id: "laser-full-leg", name: "Laser: Full leg", short: "Full leg", mins: 60, price: 900 }),
  treatment({ id: "laser-toes", name: "Laser: Toes", short: "Toes", mins: 15, price: 100 }),

  // Laser hair removal (Metro Smooth): combo packages
  combo({ id: "laser-metro-precision", name: "Laser: Metro Precision", short: "Metro Precision", detail: "Beard line, neck, nape & underarms", mins: 45, price: 450 }),
  combo({ id: "laser-chest-abdomen", name: "Laser: Chest & abdomen", short: "Chest & abdomen", mins: 45, price: 600 }),
  combo({ id: "laser-arms-leg-underarms", name: "Laser: Half arms, half leg & underarms", short: "Half arms, half leg & underarms", mins: 75, price: 900 }),
  combo({ id: "laser-legs-underarms", name: "Laser: Full legs & underarms", short: "Full legs & underarms", mins: 75, price: 900 }),
  combo({ id: "laser-back-chest-underarms", name: "Laser: Back, chest & underarms", short: "Back, chest & underarms", mins: 75, price: 900 }),
  combo({ id: "laser-arms-legs", name: "Laser: Full arms & full legs", short: "Full arms & full legs", mins: 90, price: 1200 }),
  combo({ id: "laser-metro-sleek", name: "Laser: Metro Sleek", short: "Metro Sleek", detail: "Beard line, neck, nape, ears, underarms, shoulders, chest & full arms", mins: 90, price: 1200 }),
  combo({ id: "laser-metro-platinum", name: "Laser: Metro Platinum", short: "Metro Platinum", detail: "Full body, excluding bikini & buttocks", mins: 150, price: 2000 }),
];

// Every professional takes one booking at a time during trading hours.
// `does` matches a service's provider: barbers cut hair, Metro Smooth does the laser.
export const PROFESSIONALS = [
  { id: "mohammed", name: "Mohammed", role: "Owner", photo: "images/mohammed.jpg", does: "barber" },
  { id: "papu", name: "Papu", role: "Big Boss", does: "barber" },
  { id: "ahmad", name: "Ahmad", role: "Barber", does: "barber" },
  { id: "metro-smooth", name: "Metro Smooth", role: "Laser technician", does: "laser" },
];

export const canDo = (pro, service) => pro.does === (service.provider || "barber");

// Laser hair removal by Metro Smooth at Chaps & Co (Raslouw Corner).
export const LASER = {
  provider: "Metro Smooth",
  proId: "metro-smooth",
  tagline: "Precision laser for men",
  promise: "Discreet. Professional. Proven results.",
  phoneDisplay: "060 786 6387",
  phoneLink: "tel:+27607866387",
  whatsapp: "27607866387",
  instagram: "metrosmoooth",
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
        : PROFESSIONALS.filter((p) => canDo(p, service) && !active.some((b) => b.proId === p.id && b.start < end && start < b.end)).map(
            (p) => p.id
          );
    slots.push({ time: fromMinutes(start), free, past: start < earliest });
  }
  return slots;
}
