"use strict";

// ===== Business details: edit these to update the whole site =====
const SHOP = {
  whatsapp: "27711591026", // international format, digits only
  freshaBooking:
    "https://www.fresha.com/a/chaps-and-co-raslouw-pretoria-chaps-co-barbers-jewel-beetle-street-giv79nqi/booking",
  // Google Maps pin on Jewel Beetle Street, Raslouw (City of Tshwane, 0157)
  mapEmbed: "https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s-25.855316,28.110067!6i16",
};

// Trading hours. 0 = Sunday ... 6 = Saturday. [opens, closes] in 24-hour time, or null if closed.
const HOURS = {
  0: ["08:00", "19:30"],
  1: ["09:00", "19:00"],
  2: ["08:00", "19:30"],
  3: ["08:00", "19:30"],
  4: ["08:00", "19:30"],
  5: ["08:00", "19:30"],
  6: ["08:00", "19:30"],
};

const CATEGORIES = [
  { id: "popular", name: "Popular" },
  { id: "haircuts", name: "Haircuts" },
  { id: "colour", name: "Colour" },
  { id: "beard", name: "Beard & Shave" },
  { id: "waxing", name: "Waxing" },
  { id: "therapy", name: "Therapy" },
];

// `id` is the service's Fresha ID, so "Book on Fresha" opens the same service there.
const SERVICES = [
  { id: "s:11144372", name: "Haircut", mins: 20, price: 160, cats: ["popular", "haircuts"] },
  { id: "s:11068040", name: "Haircut & Shave", mins: 60, price: 300, cats: ["popular", "haircuts", "beard"] },
  { id: "s:11067962", name: "Haircut, Wash & Style", mins: 60, price: 350, cats: ["haircuts"] },
  { id: "s:11068011", name: "Senior Haircut (gents 65+)", mins: 20, price: 100, cats: ["haircuts"] },
  { id: "s:11379491", name: "Women's Haircut", mins: 80, price: 550, cats: ["popular", "haircuts"] },
  { id: "s:11068034", name: "Hair Colour (gents)", mins: 25, price: 150, cats: ["popular", "colour"] },
  { id: "s:11067923", name: "Haircut, Colour & Wash", mins: 60, price: 350, cats: ["colour"] },
  { id: "s:11067170", name: "Beard Trim & Shape", mins: 20, price: 140, cats: ["popular", "beard"] },
  { id: "s:11067166", name: "Hot Towel Clean Shave", mins: 20, price: 120, cats: ["beard"] },
  { id: "s:11067126", name: "Nose Wax", mins: 15, price: 50, cats: ["waxing"] },
  { id: "s:11067122", name: "Ear Wax", mins: 15, price: 50, cats: ["waxing"] },
  { id: "s:11067117", name: "Cheeks Wax", mins: 15, price: 50, cats: ["waxing"] },
  { id: "s:25319364", name: "Holistic Healing Massage", mins: 60, price: 350, cats: ["popular", "therapy"] },
];

const PROFESSIONALS = [
  { id: "any", name: "Any professional", role: "Maximum availability" },
  { id: "mohammed", name: "Mohammed", role: "Owner", photo: "images/mohammed.jpg" },
  { id: "papu", name: "Papu", role: "Big Boss" },
  { id: "ahmad", name: "Ahmad", role: "Barber" },
];

const SLOT_MINUTES = 15;
const BOOKING_DAYS = 14;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ===== Helpers =====
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    const isAria = key.startsWith("aria-");
    if (value === false && !isAria) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true && !isAria ? "" : String(value));
  }
  for (const child of [].concat(children)) {
    if (child !== null && child !== undefined) node.append(child);
  }
  return node;
}

const formatPrice = (rand) => `R${rand}`;

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function dateFromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const longDate = (date) =>
  date.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });

const whatsappLink = (text) => `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;
const freshaLink = (service) =>
  service ? `${SHOP.freshaBooking}?offerItemId=${encodeURIComponent(service.id)}` : SHOP.freshaBooking;

const servicesIn = (catId) => SERVICES.filter((s) => s.cats.includes(catId));

function avatarFor(pro) {
  if (pro.photo) {
    return el("div", { class: "avatar" }, el("img", { src: pro.photo, alt: "", width: 96, height: 96, loading: "lazy" }));
  }
  if (pro.id === "any") return el("div", { class: "avatar avatar-any", "aria-hidden": "true", text: "★" });
  return el("div", { class: "avatar", "aria-hidden": "true", text: pro.name.charAt(0) });
}

// Accessible tab bar. Calls onSelect(categoryId) when the active tab changes.
function buildTabs(tablist, idPrefix, onSelect) {
  const tabs = CATEGORIES.filter((c) => servicesIn(c.id).length).map((cat) =>
    el("button", {
      type: "button",
      class: "tab",
      role: "tab",
      id: `${idPrefix}-tab-${cat.id}`,
      "data-cat": cat.id,
      text: cat.name,
    })
  );
  tablist.replaceChildren(...tabs);

  function select(tab, focus) {
    tabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute("aria-selected", active);
      t.tabIndex = active ? 0 : -1;
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: "nearest", inline: "nearest" });
    onSelect(tab.dataset.cat, tab.id);
  }

  tablist.addEventListener("click", (event) => {
    const tab = event.target.closest(".tab");
    if (tab) select(tab, false);
  });
  tablist.addEventListener("keydown", (event) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(tabs[(keys[event.key] + tabs.length) % tabs.length], true);
  });

  return { select: (catId) => select(tabs.find((t) => t.dataset.cat === catId) || tabs[0], false) };
}

// ===== Mobile menu =====
const navToggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");

function setMenu(open) {
  nav.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", open);
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
navToggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.addEventListener("click", (event) => {
  if (event.target.closest("a, button")) setMenu(false);
});

// Highlight the menu link for the section currently on screen
const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
const navSections = navLinks.map((link) => document.querySelector(link.getAttribute("href")));

function updateActiveLink() {
  const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
  let current = atBottom ? navSections.length - 1 : -1;
  if (!atBottom) {
    navSections.forEach((section, i) => {
      if (section && section.getBoundingClientRect().top <= window.innerHeight / 3) current = i;
    });
  }
  navLinks.forEach((link, i) => link.classList.toggle("active", i === current));
}
window.addEventListener("scroll", updateActiveLink, { passive: true });
updateActiveLink();

// ===== Services section with tabs =====
const servicePanel = el("div", { class: "services-grid", role: "tabpanel", tabindex: "0" });
document.getElementById("service-panels").append(servicePanel);

const serviceTabs = buildTabs(document.getElementById("service-tabs"), "services", (catId, tabId) => {
  servicePanel.setAttribute("aria-labelledby", tabId);
  servicePanel.replaceChildren(
    ...servicesIn(catId).map((service) =>
      el("article", { class: "service" }, [
        el("div", {}, [
          el("h3", { text: service.name }),
          el("span", { class: "meta", text: formatDuration(service.mins) }),
          el("span", { class: "price", text: formatPrice(service.price) }),
        ]),
        el("button", {
          type: "button",
          class: "btn btn-small",
          text: "Book",
          "aria-label": `Book ${service.name}`,
          onclick: () => openBooking({ service }),
        }),
      ])
    )
  );
});
serviceTabs.select("popular");

// ===== Team =====
document.getElementById("team-grid").replaceChildren(
  ...PROFESSIONALS.filter((p) => p.id !== "any").map((pro) =>
    el("article", { class: "barber" }, [
      avatarFor(pro),
      el("h3", { text: pro.name }),
      el("p", { text: pro.role }),
      el("button", {
        type: "button",
        class: "btn btn-small",
        text: `Book with ${pro.name}`,
        onclick: () => openBooking({ pro }),
      }),
    ])
  )
);

// ===== Booking flow =====
const dialog = document.getElementById("booking");
const STEPS = {
  service: { label: "Step 1 of 4", title: "Select a service", progress: 25 },
  professional: { label: "Step 2 of 4", title: "Select a professional", progress: 50 },
  time: { label: "Step 3 of 4", title: "Select a date & time", progress: 75 },
  details: { label: "Step 4 of 4", title: "Confirm your booking", progress: 100 },
  done: { label: "All set", title: "Your booking is ready to send", progress: 100 },
};

const booking = { service: null, pro: null, proLocked: false, date: null, time: null, history: [] };

const bookingTabs = buildTabs(document.getElementById("booking-tabs"), "booking", (catId) => {
  const list = document.getElementById("booking-services");
  list.replaceChildren(
    ...servicesIn(catId).map((service) =>
      el(
        "button",
        {
          type: "button",
          class: "choice",
          "aria-pressed": booking.service === service,
          onclick: () => {
            booking.service = service;
            if (!servicesFit(booking.date)) booking.date = null;
            goTo(booking.proLocked ? "time" : "professional");
          },
        },
        [
          el("span", { class: "choice-main" }, [
            el("span", { class: "choice-title", text: service.name }),
            el("span", { class: "choice-sub", text: formatDuration(service.mins) }),
          ]),
          el("span", { class: "choice-price", text: formatPrice(service.price) }),
        ]
      )
    )
  );
});

function renderProfessionals() {
  document.getElementById("booking-pros").replaceChildren(
    ...PROFESSIONALS.map((pro) =>
      el(
        "button",
        {
          type: "button",
          class: "choice",
          "aria-pressed": booking.pro === pro,
          onclick: () => {
            booking.pro = pro;
            goTo("time");
          },
        },
        [
          avatarFor(pro),
          el("span", { class: "choice-main" }, [
            el("span", { class: "choice-title", text: pro.name }),
            el("span", { class: "choice-sub", text: pro.role }),
          ]),
        ]
      )
    )
  );
}

// Start times on a given day that leave room for the whole service before closing.
function slotsFor(key) {
  if (!key || !booking.service) return [];
  const date = dateFromKey(key);
  const hours = HOURS[date.getDay()];
  if (!hours) return [];

  let start = toMinutes(hours[0]);
  const lastStart = toMinutes(hours[1]) - booking.service.mins;

  if (key === dateKey(new Date())) {
    // Today: only offer times at least 30 minutes from now
    const now = new Date();
    const earliest = now.getHours() * 60 + now.getMinutes() + 30;
    start = Math.max(start, Math.ceil(earliest / SLOT_MINUTES) * SLOT_MINUTES);
  }

  const slots = [];
  for (let t = start; t <= lastStart; t += SLOT_MINUTES) slots.push(fromMinutes(t));
  return slots;
}
const servicesFit = (key) => slotsFor(key).length > 0;

function renderTimes() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < BOOKING_DAYS; i++) {
    dates.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  }
  if (!booking.date) {
    const firstOpen = dates.find((d) => servicesFit(dateKey(d)));
    booking.date = firstOpen ? dateKey(firstOpen) : dateKey(today);
  }

  document.getElementById("booking-dates").replaceChildren(
    ...dates.map((date, i) => {
      const key = dateKey(date);
      return el(
        "button",
        {
          type: "button",
          class: "date-btn",
          role: "option",
          "aria-selected": key === booking.date,
          "aria-label": longDate(date),
          onclick: () => {
            booking.date = key;
            booking.time = null;
            renderTimes();
          },
        },
        [
          el("span", { text: i === 0 ? "Today" : DAY_NAMES[date.getDay()].slice(0, 3) }),
          el("strong", { text: date.getDate() }),
          el("span", { text: date.toLocaleDateString("en-ZA", { month: "short" }) }),
        ]
      );
    })
  );
  document.querySelector('.date-btn[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });

  const slots = slotsFor(booking.date);
  document.getElementById("booking-no-times").hidden = slots.length > 0;
  document.getElementById("booking-times").replaceChildren(
    ...slots.map((time) =>
      el("button", {
        type: "button",
        class: "time-btn",
        role: "option",
        "aria-selected": time === booking.time,
        text: time,
        onclick: () => {
          booking.time = time;
          goTo("details");
        },
      })
    )
  );
}

function renderSummary() {
  const { service, pro, date, time } = booking;
  const end = fromMinutes(toMinutes(time) + service.mins);
  const rows = [
    ["Service", service.name],
    ["Professional", pro.name],
    ["Date", longDate(dateFromKey(date))],
    ["Time", `${time} – ${end}`],
    ["Duration", formatDuration(service.mins)],
    ["Total", formatPrice(service.price)],
  ];
  document.getElementById("booking-summary").replaceChildren(
    ...rows.flatMap(([label, value]) => {
      const cls = label === "Total" ? "total" : undefined;
      return [el("dt", { class: cls, text: label }), el("dd", { class: cls, text: value })];
    })
  );
}

function showStep(step) {
  const info = STEPS[step];
  dialog.querySelectorAll(".step").forEach((s) => (s.hidden = s.dataset.step !== step));
  document.getElementById("booking-step-label").textContent = info.label;
  document.getElementById("booking-title").textContent = info.title;
  document.getElementById("booking-progress-bar").style.width = `${info.progress}%`;
  document.getElementById("booking-back").disabled = booking.history.length <= 1 || step === "done";
  document.getElementById("booking-foot").hidden = step === "done";

  const { service } = booking;
  document.getElementById("booking-total").textContent = service
    ? `${service.name} · ${formatPrice(service.price)} · ${formatDuration(service.mins)}`
    : "";
  document.getElementById("booking-fresha").href = freshaLink(service);

  if (step === "service") {
    bookingTabs.select(service ? service.cats[0] : "popular");
  }
  if (step === "professional") renderProfessionals();
  if (step === "time") renderTimes();
  if (step === "details") renderSummary();

  dialog.querySelector(".booking-body").scrollTop = 0;
}

function goTo(step) {
  booking.history.push(step);
  showStep(step);
}

function goBack() {
  if (booking.history.length <= 1) return;
  booking.history.pop();
  showStep(booking.history[booking.history.length - 1]);
}

function openBooking({ service = null, pro = null } = {}) {
  Object.assign(booking, {
    service,
    pro,
    proLocked: Boolean(pro),
    date: null,
    time: null,
    history: [],
  });
  bookingForm.reset();
  bookingForm.querySelectorAll(".invalid").forEach((f) => f.classList.remove("invalid"));
  bookingMessage.textContent = "";

  // Booking a service goes straight to choosing a professional (Back still returns to the service list)
  if (service) booking.history.push("service");
  goTo(service ? "professional" : "service");
  dialog.showModal();
  document.documentElement.classList.add("no-scroll");
}

document.querySelectorAll("[data-book]").forEach((button) =>
  button.addEventListener("click", () => openBooking())
);
function closeBooking() {
  if (dialog.open) dialog.close();
  document.documentElement.classList.remove("no-scroll");
}

document.getElementById("booking-back").addEventListener("click", goBack);
document.getElementById("booking-close").addEventListener("click", closeBooking);
document.getElementById("booking-finish").addEventListener("click", closeBooking);
// Escape key
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeBooking();
});
dialog.addEventListener("close", () => document.documentElement.classList.remove("no-scroll"));
// Close when clicking the dark backdrop outside the dialog
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
  if (!inside) closeBooking();
});

// Details form: validate, then open WhatsApp with the booking filled in
const bookingForm = document.getElementById("booking-form");
const bookingMessage = document.getElementById("booking-message");

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = bookingForm.elements.name.value.trim().replace(/\s+/g, " ");
  const phone = bookingForm.elements.phone.value.trim();
  const note = bookingForm.elements.note.value.trim();
  const nameOk = name.length >= 2;
  const phoneOk = /^[0-9 +()-]{9,20}$/.test(phone) && phone.replace(/\D/g, "").length >= 9;

  bookingForm.elements.name.classList.toggle("invalid", !nameOk);
  bookingForm.elements.phone.classList.toggle("invalid", !phoneOk);
  if (!nameOk || !phoneOk) {
    bookingMessage.textContent = !nameOk ? "Please enter your name." : "Please enter a valid phone number.";
    (!nameOk ? bookingForm.elements.name : bookingForm.elements.phone).focus();
    return;
  }
  bookingMessage.textContent = "";

  const { service, pro, date, time } = booking;
  const lines = [
    "Hi Chaps & Co, I'd like to book an appointment:",
    "",
    `Service: ${service.name} (${formatPrice(service.price)}, ${formatDuration(service.mins)})`,
    `Professional: ${pro.name}`,
    `Date: ${longDate(dateFromKey(date))}`,
    `Time: ${time}`,
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
  ];
  if (note) lines.push(`Note: ${note}`);
  const link = whatsappLink(lines.join("\n"));

  window.open(link, "_blank", "noopener");

  const doneText = document.getElementById("booking-done-text");
  doneText.replaceChildren(
    `Thanks ${name.split(" ")[0]}! WhatsApp has opened with your booking for ${service.name} on ${longDate(
      dateFromKey(date)
    )} at ${time}. Press send and we'll confirm your appointment. `,
    el("a", { href: link, target: "_blank", rel: "noopener noreferrer", text: "WhatsApp didn't open? Tap here." })
  );
  goTo("done");
});

// ===== Trading hours & open badge =====
const hoursBody = document.querySelector("#hours-table tbody");
[1, 2, 3, 4, 5, 6, 0].forEach((day) => {
  const hours = HOURS[day];
  hoursBody.append(
    el("tr", { "data-day": day }, [
      el("td", { text: DAY_NAMES[day] }),
      el("td", { text: hours ? `${hours[0]} – ${hours[1]}` : "Closed" }),
    ])
  );
});

function updateOpenStatus() {
  const now = new Date();
  const today = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const hours = HOURS[today];
  const open = hours && mins >= toMinutes(hours[0]) && mins < toMinutes(hours[1]);

  hoursBody.querySelectorAll("tr").forEach((row) => row.classList.toggle("today", Number(row.dataset.day) === today));

  let text = open ? `Open now · until ${hours[1]}` : "Closed now";
  if (!open) {
    for (let i = 0; i < 7; i++) {
      const day = (today + i) % 7;
      const h = HOURS[day];
      if (!h || (i === 0 && mins >= toMinutes(h[0]))) continue;
      text = `Closed · opens ${i === 0 ? "today" : i === 1 ? "tomorrow" : DAY_NAMES[day]} ${h[0]}`;
      break;
    }
  }
  const badge = document.getElementById("open-badge");
  badge.textContent = text;
  badge.classList.toggle("is-open", Boolean(open));
}
updateOpenStatus();
setInterval(updateOpenStatus, 60 * 1000);

// ===== Map & cookie consent =====
const CONSENT_KEY = "chaps-cookie-consent";
const mapWrap = document.getElementById("map-wrap");
const mapPlaceholder = document.getElementById("map-placeholder");
const cookieBanner = document.getElementById("cookie-banner");

function readConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

function loadMap() {
  if (mapWrap.querySelector("iframe")) return;
  mapPlaceholder.hidden = true;
  mapWrap.append(
    el("iframe", {
      src: SHOP.mapEmbed,
      title: "Map showing Chaps & Co Barbers on Jewel Beetle Street, Raslouw",
      loading: "lazy",
      referrerpolicy: "no-referrer-when-downgrade",
      allowfullscreen: true,
    })
  );
}

function unloadMap() {
  mapWrap.querySelector("iframe")?.remove();
  mapPlaceholder.hidden = false;
}

function setCookieBanner(visible) {
  cookieBanner.hidden = !visible;
  document.body.classList.toggle("has-cookie-banner", visible);
}

function saveConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Storage blocked (e.g. private mode): the choice applies to this visit only
  }
  value === "all" ? loadMap() : unloadMap();
  setCookieBanner(false);
}

document.getElementById("cookie-accept").addEventListener("click", () => saveConsent("all"));
document.getElementById("cookie-essential").addEventListener("click", () => saveConsent("essential"));
document.getElementById("cookie-settings").addEventListener("click", () => setCookieBanner(true));
document.getElementById("load-map").addEventListener("click", loadMap);

const consent = readConsent();
if (consent === "all") loadMap();
if (!consent) setCookieBanner(true);

// ===== Misc =====
document.getElementById("whatsapp-float").href = whatsappLink("Hi Chaps & Co, ");
document.getElementById("year").textContent = new Date().getFullYear();
