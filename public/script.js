import {
  BOOKING,
  CATEGORIES,
  DAY_NAMES,
  HOURS,
  PROFESSIONALS,
  SERVICES,
  SHOP,
  addDays,
  shopNow,
  toMinutes,
  fromMinutes,
  weekdayOf,
} from "./shop-data.js";

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

const $ = (selector) => document.querySelector(selector);
const formatPrice = (rand) => `R${rand}`;

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNum = (dateKey) => Number(dateKey.slice(8, 10));
const longDate = (dateKey) =>
  `${DAY_NAMES[weekdayOf(dateKey)]} ${dayNum(dateKey)} ${MONTHS_LONG[Number(dateKey.slice(5, 7)) - 1]}`;

const whatsappLink = (text) => `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;
const servicesIn = (catId) => SERVICES.filter((s) => s.cats.includes(catId));
const ANY_PRO = { id: "any", name: "Any professional", role: "Maximum availability" };

function avatarFor(pro) {
  if (pro.photo) {
    return el("div", { class: "avatar" }, el("img", { src: pro.photo, alt: "", width: 96, height: 96, loading: "lazy" }));
  }
  if (pro.id === "any") return el("div", { class: "avatar avatar-any", "aria-hidden": "true", text: "★" });
  return el("div", { class: "avatar", "aria-hidden": "true", text: pro.name.charAt(0) });
}

// Accessible tab bar. Calls onSelect(categoryId, tabId) when the active tab changes.
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

// ===== Navigation =====
const navToggle = $(".nav-toggle");
const nav = $("#site-nav");

function setMenu(open) {
  nav.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", open);
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
if (nav && navToggle) {
  navToggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) setMenu(false);
  });
}

// Highlight the current page, or on the home page the section on screen
const page = location.pathname.split("/").pop() || "index.html";
const navLinks = nav ? [...nav.querySelectorAll("a")] : [];
navLinks.forEach((link) => {
  const target = link.getAttribute("href");
  if (!target.includes("#") && target === page) link.classList.add("active");
});

const sectionLinks = navLinks.filter((link) => {
  const hash = link.getAttribute("href").split("#")[1];
  return hash && document.getElementById(hash);
});
const navSections = sectionLinks.map((link) => document.getElementById(link.getAttribute("href").split("#")[1]));

function updateActiveLink() {
  const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
  let current = atBottom ? navSections.length - 1 : -1;
  if (!atBottom) {
    navSections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= window.innerHeight / 3) current = i;
    });
  }
  sectionLinks.forEach((link, i) => link.classList.toggle("active", i === current));
}
if (sectionLinks.length) {
  window.addEventListener("scroll", updateActiveLink, { passive: true });
  updateActiveLink();
}

// ===== Services page: tabs and price cards =====
const serviceTabList = $("#service-tabs");
if (serviceTabList) {
  const servicePanel = el("div", { class: "services-grid", role: "tabpanel", tabindex: "0" });
  $("#service-panels").append(servicePanel);

  buildTabs(serviceTabList, "services", (catId, tabId) => {
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
  }).select("popular");
}

// ===== Team =====
const teamGrid = $("#team-grid");
if (teamGrid) {
  teamGrid.replaceChildren(
    ...PROFESSIONALS.map((pro) =>
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
}

// ===== Booking window =====
// Steps: service → professional → date & time → your details → confirmed.
// Times come from the booking server (/api/availability), and a booking is only shown as
// confirmed after the server has saved it (/api/book), so taken times can't be double-booked.
const STEPS = {
  service: { label: "Step 1 of 4", title: "Select a service", progress: 25 },
  professional: { label: "Step 2 of 4", title: "Select a professional", progress: 50 },
  time: { label: "Step 3 of 4", title: "Select a date & time", progress: 75 },
  details: { label: "Step 4 of 4", title: "Confirm your booking", progress: 100 },
  done: { label: "Booked", title: "You're booked in", progress: 100 },
};

const booking = { service: null, pro: null, proLocked: false, date: null, time: null, history: [], submitting: false };
let ui = null;
let availabilityRequest = 0;

function createBookingUI() {
  const refs = {};

  refs.serviceTabs = el("div", { class: "tabs tabs-small", role: "tablist", "aria-label": "Service categories" });
  refs.serviceList = el("div", { class: "choice-list" });
  refs.proList = el("div", { class: "choice-list" });
  refs.dates = el("div", { class: "date-strip", role: "listbox", "aria-label": "Choose a date" });
  refs.times = el("div", { class: "time-grid", role: "listbox", "aria-label": "Choose a time" });
  refs.timeStatus = el("p", { class: "muted small", role: "status" });
  refs.legend = el("p", { class: "slot-legend" }, [
    el("span", { class: "legend-free" }),
    "Available",
    el("span", { class: "legend-taken" }),
    "Booked",
  ]);
  refs.summary = el("dl", { class: "summary" });
  refs.message = el("p", { class: "form-message", role: "alert" });
  refs.submit = el("button", { type: "submit", class: "btn btn-block", text: "Confirm booking" });
  refs.form = el("form", { class: "booking-form", novalidate: true }, [
    el("label", {}, ["Your name", el("input", { type: "text", name: "name", required: true, maxlength: 60, autocomplete: "name" })]),
    el("label", {}, [
      "Phone number",
      el("input", { type: "tel", name: "phone", required: true, maxlength: 20, autocomplete: "tel", inputmode: "tel" }),
    ]),
    el("label", {}, [
      "Note for your barber ",
      el("span", { class: "muted", text: "(optional)" }),
      el("textarea", { name: "note", rows: 2, maxlength: 300 }),
    ]),
    // Honeypot: hidden from people, filled in by spam bots
    el("label", { class: "visually-hidden", "aria-hidden": "true" }, [
      "Company",
      el("input", { type: "text", name: "company", tabindex: "-1", autocomplete: "off" }),
    ]),
    refs.message,
    refs.submit,
  ]);
  refs.doneText = el("div", { class: "done-details" });

  refs.footTotal = el("div", { class: "booking-total" });
  refs.continueBtn = el("button", { type: "button", class: "btn", text: "Continue", onclick: () => afterService() });
  refs.foot = el("div", { class: "booking-foot" }, [refs.footTotal, refs.continueBtn]);

  refs.title = el("h2", { id: "booking-title" });
  refs.stepLabel = el("p", { class: "booking-step-label" });
  refs.progress = el("span");
  refs.back = el("button", { type: "button", class: "icon-btn", "aria-label": "Go back", text: "←", onclick: goBack });

  refs.steps = {
    service: el("div", { class: "step", "data-step": "service" }, [refs.serviceTabs, refs.serviceList]),
    professional: el("div", { class: "step", "data-step": "professional" }, refs.proList),
    time: el("div", { class: "step", "data-step": "time" }, [refs.dates, refs.legend, refs.times, refs.timeStatus]),
    details: el("div", { class: "step", "data-step": "details" }, [refs.summary, refs.form]),
    done: el("div", { class: "step", "data-step": "done" }, [
      el("div", { class: "done" }, [
        el("div", { class: "done-icon", "aria-hidden": "true", text: "✓" }),
        refs.doneText,
        el("button", { type: "button", class: "btn", text: "Done", onclick: closeBooking }),
      ]),
    ]),
  };

  refs.dialog = el("dialog", { class: "booking", "aria-labelledby": "booking-title" }, [
    el("div", { class: "booking-head" }, [
      refs.back,
      el("div", { class: "booking-progress", "aria-hidden": "true" }, refs.progress),
      el("button", { type: "button", class: "icon-btn", "aria-label": "Close booking", text: "×", onclick: closeBooking }),
    ]),
    refs.stepLabel,
    refs.title,
    el("div", { class: "booking-body" }, Object.values(refs.steps)),
    refs.foot,
  ]);

  refs.dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeBooking();
  });
  refs.dialog.addEventListener("close", () => document.documentElement.classList.remove("no-scroll"));
  refs.dialog.addEventListener("click", (event) => {
    if (event.target !== refs.dialog) return;
    const r = refs.dialog.getBoundingClientRect();
    const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
    if (!inside) closeBooking();
  });
  refs.form.addEventListener("submit", submitBooking);

  document.body.append(refs.dialog);

  refs.tabs = buildTabs(refs.serviceTabs, "booking", (catId) => {
    refs.serviceList.replaceChildren(
      ...servicesIn(catId).map((service) =>
        el(
          "button",
          {
            type: "button",
            class: "choice",
            "aria-pressed": booking.service === service,
            onclick: (event) => {
              booking.service = service;
              booking.time = null;
              refs.serviceList
                .querySelectorAll(".choice")
                .forEach((c) => c.setAttribute("aria-pressed", c === event.currentTarget));
              updateFoot();
            },
          },
          [
            el("span", { class: "choice-main" }, [
              el("span", { class: "choice-title", text: service.name }),
              el("span", { class: "choice-sub", text: formatDuration(service.mins) }),
            ]),
            el("span", { class: "choice-price", text: formatPrice(service.price) }),
            el("span", { class: "choice-check", "aria-hidden": "true" }),
          ]
        )
      )
    );
  });

  return refs;
}

function updateFoot() {
  const { service } = booking;
  ui.footTotal.textContent = service ? `${service.name} · ${formatPrice(service.price)} · ${formatDuration(service.mins)}` : "";
  ui.continueBtn.disabled = !service;
}

function afterService() {
  if (!booking.service) return;
  goTo(booking.proLocked ? "time" : "professional");
}

function renderProfessionals() {
  ui.proList.replaceChildren(
    ...[ANY_PRO, ...PROFESSIONALS].map((pro) =>
      el(
        "button",
        {
          type: "button",
          class: "choice",
          "aria-pressed": booking.pro?.id === pro.id,
          onclick: () => {
            booking.pro = pro;
            booking.time = null;
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

function bookableDates() {
  const today = shopNow().dateKey;
  return Array.from({ length: BOOKING.daysAhead }, (_, i) => addDays(today, i));
}

function renderDates() {
  const dates = bookableDates();
  if (!booking.date || !dates.includes(booking.date)) booking.date = dates[0];

  ui.dates.replaceChildren(
    ...dates.map((date, i) => {
      const closed = !HOURS[weekdayOf(date)];
      return el(
        "button",
        {
          type: "button",
          class: "date-btn",
          role: "option",
          disabled: closed,
          "aria-selected": date === booking.date,
          "aria-label": longDate(date),
          onclick: () => {
            booking.date = date;
            booking.time = null;
            renderDates();
            loadTimes();
          },
        },
        [
          el("span", { text: i === 0 ? "Today" : DAY_NAMES[weekdayOf(date)].slice(0, 3) }),
          el("strong", { text: dayNum(date) }),
          el("span", { text: MONTHS[Number(date.slice(5, 7)) - 1] }),
        ]
      );
    })
  );
  ui.dates.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
}

// Fetches live availability for the chosen service and day, and draws free and booked times.
async function loadTimes() {
  const request = ++availabilityRequest;
  const { service, pro, date } = booking;
  ui.times.replaceChildren();
  ui.legend.hidden = true;
  ui.timeStatus.textContent = "Loading available times…";

  let data;
  try {
    const response = await fetch(
      `/api/availability?date=${encodeURIComponent(date)}&service=${encodeURIComponent(service.id)}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "We couldn't load times right now.");
  } catch (error) {
    if (request !== availabilityRequest) return;
    ui.timeStatus.replaceChildren(
      `${error.message && !/fetch/i.test(error.message) ? error.message : "We couldn't load times. Check your connection."} `,
      el("button", { type: "button", class: "link-button", text: "Try again", onclick: loadTimes })
    );
    return;
  }
  if (request !== availabilityRequest) return; // a newer day/service was chosen meanwhile

  const isFree = (slot) => (pro.id === "any" ? slot.free.length > 0 : slot.free.includes(pro.id));
  const freeCount = data.slots.filter(isFree).length;

  ui.legend.hidden = data.slots.length === 0;
  ui.timeStatus.textContent = !data.slots.length
    ? "No times left on this day. Please choose another date."
    : freeCount === 0
      ? `Fully booked${pro.id === "any" ? "" : ` for ${pro.name}`} on this day. Please choose another date${pro.id === "any" ? "" : " or professional"}.`
      : "";

  ui.times.replaceChildren(
    ...data.slots.map((slot) => {
      const free = isFree(slot);
      return el("button", {
        type: "button",
        class: `time-btn${free ? "" : " taken"}`,
        role: "option",
        disabled: !free,
        "aria-disabled": !free,
        "aria-selected": slot.time === booking.time,
        "aria-label": free ? slot.time : `${slot.time}, booked`,
        text: slot.time,
        onclick: () => {
          booking.time = slot.time;
          goTo("details");
        },
      });
    })
  );
}

function renderSummary() {
  const { service, pro, date, time } = booking;
  const rows = [
    ["Service", service.name],
    ["Professional", pro.name],
    ["Date", longDate(date)],
    ["Time", `${time} – ${fromMinutes(toMinutes(time) + service.mins)}`],
    ["Total", formatPrice(service.price)],
  ];
  ui.summary.replaceChildren(
    ...rows.flatMap(([label, value]) => {
      const cls = label === "Total" ? "total" : undefined;
      return [el("dt", { class: cls, text: label }), el("dd", { class: cls, text: value })];
    })
  );
  ui.message.textContent = "";
}

async function submitBooking(event) {
  event.preventDefault();
  if (booking.submitting) return; // ignore double taps while saving

  const form = ui.form.elements;
  const name = form.name.value.trim().replace(/\s+/g, " ");
  const phone = form.phone.value.trim();
  const nameOk = name.length >= 2;
  const phoneOk = /^[0-9 +()-]{9,20}$/.test(phone) && phone.replace(/\D/g, "").length >= 9;
  form.name.classList.toggle("invalid", !nameOk);
  form.phone.classList.toggle("invalid", !phoneOk);
  if (!nameOk || !phoneOk) {
    ui.message.textContent = !nameOk ? "Please enter your name." : "Please enter a valid phone number.";
    (!nameOk ? form.name : form.phone).focus();
    return;
  }

  booking.submitting = true;
  ui.submit.disabled = true;
  ui.submit.textContent = "Booking…";
  ui.message.textContent = "";

  try {
    const response = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        service: booking.service.id,
        pro: booking.pro.id,
        date: booking.date,
        time: booking.time,
        name,
        phone,
        note: form.note.value.trim(),
        company: form.company.value,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 201 && data.ok) {
      showConfirmation(data.booking);
      return;
    }
    if (response.status === 409 && data.error === "slot_taken") {
      // Someone else got this time first: go back to the times and refresh them
      booking.time = null;
      booking.submitting = false;
      goBack();
      ui.timeStatus.textContent = data.message;
      return;
    }
    ui.message.textContent = data.message || "We couldn't save your booking. Please try again.";
  } catch {
    ui.message.textContent = `We couldn't reach the booking system. Check your connection and try again, or call ${SHOP.phoneDisplay}.`;
  } finally {
    booking.submitting = false;
    ui.submit.disabled = false;
    ui.submit.textContent = "Confirm booking";
  }
}

function showConfirmation(saved) {
  ui.doneText.replaceChildren(
    el("p", { class: "done-lead", text: `Thanks ${saved.name.split(" ")[0]}, your appointment is confirmed.` }),
    el("dl", { class: "summary" }, [
      el("dt", { text: "Reference" }),
      el("dd", { text: saved.ref }),
      el("dt", { text: "Service" }),
      el("dd", { text: saved.serviceName }),
      el("dt", { text: "Professional" }),
      el("dd", { text: saved.proName }),
      el("dt", { text: "Date" }),
      el("dd", { text: longDate(saved.date) }),
      el("dt", { text: "Time" }),
      el("dd", { text: `${saved.time} – ${fromMinutes(saved.end)}` }),
      el("dt", { class: "total", text: "Pay at the shop" }),
      el("dd", { class: "total", text: formatPrice(saved.price) }),
    ]),
    el("p", { class: "muted small" }, [
      "Need to change or cancel? Call or WhatsApp us on ",
      el("a", { href: SHOP.phoneLink, text: SHOP.phoneDisplay }),
      " and quote your reference.",
    ])
  );
  booking.history = [];
  goTo("done");
}

function showStep(step) {
  const info = STEPS[step];
  Object.entries(ui.steps).forEach(([name, node]) => (node.hidden = name !== step));
  ui.stepLabel.textContent = info.label;
  ui.title.textContent = info.title;
  ui.progress.style.width = `${info.progress}%`;
  ui.back.disabled = booking.history.length <= 1 || step === "done";
  ui.foot.hidden = step !== "service";

  if (step === "service") {
    ui.tabs.select(booking.service ? booking.service.cats[0] : "popular");
    updateFoot();
  }
  if (step === "professional") renderProfessionals();
  if (step === "time") {
    renderDates();
    loadTimes();
  }
  if (step === "details") renderSummary();

  ui.dialog.querySelector(".booking-body").scrollTop = 0;
}

function goTo(step) {
  booking.history.push(step);
  showStep(step);
}

function goBack() {
  if (booking.history.length <= 1 || booking.submitting) return;
  booking.history.pop();
  showStep(booking.history[booking.history.length - 1]);
}

function openBooking({ service = null, pro = null } = {}) {
  if (!ui) ui = createBookingUI();
  Object.assign(booking, {
    service: service || SERVICES.find((s) => s.id === BOOKING.defaultServiceId) || null,
    pro,
    proLocked: Boolean(pro),
    date: null,
    time: null,
    history: [],
    submitting: false,
  });
  ui.form.reset();
  ui.form.querySelectorAll(".invalid").forEach((f) => f.classList.remove("invalid"));

  if (service) {
    // Booking a specific service goes straight to choosing a professional (Back returns to services)
    booking.history.push("service");
    goTo("professional");
  } else {
    goTo("service");
  }
  ui.dialog.showModal();
  document.documentElement.classList.add("no-scroll");
}

function closeBooking() {
  if (booking.submitting) return;
  if (ui.dialog.open) ui.dialog.close();
  document.documentElement.classList.remove("no-scroll");
}

document.querySelectorAll("[data-book]").forEach((button) => button.addEventListener("click", () => openBooking()));

// ===== Trading hours & open status (shop time, Africa/Johannesburg) =====
document.querySelectorAll("[data-hours-table] tbody").forEach((body) => {
  [1, 2, 3, 4, 5, 6, 0].forEach((day) => {
    const hours = HOURS[day];
    body.append(
      el("tr", { "data-day": day }, [
        el("td", { text: DAY_NAMES[day] }),
        el("td", { text: hours ? `${hours[0]} – ${hours[1]}` : "Closed" }),
      ])
    );
  });
});

function updateOpenStatus() {
  const { day: today, mins } = shopNow();
  const hours = HOURS[today];
  const open = hours && mins >= toMinutes(hours[0]) && mins < toMinutes(hours[1]);

  document
    .querySelectorAll("[data-hours-table] tr[data-day]")
    .forEach((row) => row.classList.toggle("today", Number(row.dataset.day) === today));

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
  document.querySelectorAll("[data-open-badge]").forEach((badge) => {
    badge.textContent = text;
    badge.classList.toggle("is-open", Boolean(open));
  });
}
if (document.querySelector("[data-open-badge], [data-hours-table]")) {
  updateOpenStatus();
  setInterval(updateOpenStatus, 60 * 1000);
}

// ===== Map & cookie consent =====
const CONSENT_KEY = "chaps-cookie-consent";
const mapWrap = $("#map-wrap");
const mapPlaceholder = $("#map-placeholder");

function readConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

function loadMap() {
  if (!mapWrap || mapWrap.querySelector("iframe")) return;
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
  if (!mapWrap) return;
  mapWrap.querySelector("iframe")?.remove();
  mapPlaceholder.hidden = false;
}

const cookieBanner = el("div", { class: "cookie-banner", role: "region", "aria-label": "Cookie consent", hidden: true }, [
  el("p", {}, [
    "We only use essential browser storage to remember your choices. With your permission we also load Google Maps, which may set its own cookies. ",
    el("a", { href: "privacy.html", text: "Learn more" }),
  ]),
  el("div", { class: "cookie-actions" }, [
    el("button", {
      type: "button",
      class: "btn btn-small btn-ghost",
      text: "Essential only",
      onclick: () => saveConsent("essential"),
    }),
    el("button", { type: "button", class: "btn btn-small", text: "Accept all", onclick: () => saveConsent("all") }),
  ]),
]);
document.body.append(cookieBanner);

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

$("#cookie-settings")?.addEventListener("click", () => setCookieBanner(true));
$("#load-map")?.addEventListener("click", loadMap);

const consent = readConsent();
if (consent === "all") loadMap();
if (!consent) setCookieBanner(true);

// ===== Floating WhatsApp button & footer year =====
const waIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
waIcon.setAttribute("viewBox", "0 0 24 24");
waIcon.setAttribute("width", "28");
waIcon.setAttribute("height", "28");
waIcon.setAttribute("aria-hidden", "true");
const waPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
waPath.setAttribute("fill", "currentColor");
waPath.setAttribute(
  "d",
  "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z"
);
waIcon.append(waPath);
document.body.append(
  el(
    "a",
    {
      class: "whatsapp-float",
      href: whatsappLink("Hi Chaps & Co, "),
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": "Chat with us on WhatsApp",
    },
    waIcon
  )
);

document.querySelectorAll("[data-year]").forEach((node) => (node.textContent = new Date().getFullYear()));
