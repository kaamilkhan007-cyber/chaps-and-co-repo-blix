"use strict";

// ===== Business details: edit these to update the whole site =====
const SHOP = {
  whatsapp: "27711591026", // international format, digits only
  timeZone: "Africa/Johannesburg",
  // Official Fresha booking page. Fresha checks live availability and confirms every appointment.
  freshaBooking:
    "https://www.fresha.com/a/chaps-and-co-raslouw-pretoria-chaps-co-barbers-jewel-beetle-street-giv79nqi/booking",
  // Google Maps pin on Jewel Beetle Street, Raslouw (City of Tshwane, 0157)
  mapEmbed: "https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s-25.855316,28.110067!6i16",
};

// Service selected when the booking window opens. Fresha's public booking link only accepts a
// service (offerItemId); professional, date and time are chosen on Fresha from its live calendar.
const DEFAULT_SERVICE_ID = "s:11144372"; // Haircut

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

// `id` is the service's Fresha ID, so booking opens the same service on Fresha.
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
  { id: "mohammed", name: "Mohammed", role: "Owner", photo: "images/mohammed.jpg" },
  { id: "papu", name: "Papu", role: "Big Boss" },
  { id: "ahmad", name: "Ahmad", role: "Barber" },
];

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

const $ = (selector) => document.querySelector(selector);
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

// Current day and time at the shop, whatever the visitor's own time zone is.
function shopNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: SHOP.timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return { day, mins: Number(parts.hour) * 60 + Number(parts.minute) };
}

const whatsappLink = (text) => `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;
const freshaLink = (service) =>
  service ? `${SHOP.freshaBooking}?offerItemId=${encodeURIComponent(service.id)}` : SHOP.freshaBooking;

const servicesIn = (catId) => SERVICES.filter((s) => s.cats.includes(catId));

function avatarFor(pro) {
  if (pro.photo) {
    return el("div", { class: "avatar" }, el("img", { src: pro.photo, alt: "", width: 96, height: 96, loading: "lazy" }));
  }
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
            onclick: () => openBooking({ service, skipToReview: true }),
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
// The site helps customers pick a service, then hands over to Fresha's official booking page,
// where they choose a professional, date and time from live availability and Fresha confirms.
// Nothing is booked or stored on this website.
let bookingUI = null;
const booking = { service: null, pro: null, history: [] };

function createBookingUI() {
  const serviceList = el("div", { class: "choice-list" });
  const tabList = el("div", { class: "tabs tabs-small", role: "tablist", "aria-label": "Service categories" });
  const summary = el("dl", { class: "summary" });
  const proNote = el("p", { class: "handoff-note" });
  const handoffStatus = el("p", { class: "handoff-status", role: "status" });
  const footTotal = el("div", { class: "booking-total" });
  const continueBtn = el("button", { type: "button", class: "btn", text: "Continue", onclick: () => goTo("review") });
  const freshaBtn = el("a", {
    class: "btn btn-block",
    target: "_blank",
    rel: "noopener noreferrer",
    text: "Continue to Fresha",
  });

  // Ignore repeat taps for a moment so customers don't open several booking tabs
  let opening = false;
  freshaBtn.addEventListener("click", (event) => {
    if (opening) {
      event.preventDefault();
      return;
    }
    opening = true;
    freshaBtn.setAttribute("aria-disabled", "true");
    handoffStatus.textContent =
      "Fresha has opened in a new tab. Choose your professional, date and time there. Your booking is only confirmed once Fresha shows its confirmation.";
    setTimeout(() => {
      opening = false;
      freshaBtn.removeAttribute("aria-disabled");
    }, 3000);
  });

  const title = el("h2", { id: "booking-title" });
  const stepLabel = el("p", { class: "booking-step-label" });
  const progress = el("span");
  const backBtn = el("button", { type: "button", class: "icon-btn", "aria-label": "Go back", text: "←", onclick: goBack });
  const closeBtn = el("button", {
    type: "button",
    class: "icon-btn",
    "aria-label": "Close booking",
    text: "×",
    onclick: closeBooking,
  });

  const steps = {
    service: el("div", { class: "step", "data-step": "service" }, [tabList, serviceList]),
    review: el("div", { class: "step", "data-step": "review" }, [
      summary,
      el("div", { class: "handoff" }, [
        el("h3", { text: "Live availability on Fresha" }),
        el("p", {
          text: "We take bookings through Fresha, our booking provider. On the next screen you'll see the times that are actually free, choose your professional, date and time, and Fresha will confirm your appointment.",
        }),
        proNote,
      ]),
      freshaBtn,
      handoffStatus,
      el("p", { class: "muted small center" }, [
        "Questions first? ",
        el("a", {
          href: whatsappLink("Hi Chaps & Co, I have a question about booking."),
          target: "_blank",
          rel: "noopener noreferrer",
          text: "WhatsApp us",
        }),
        " or call ",
        el("a", { href: "tel:+27711591026", text: "071 159 1026" }),
        ".",
      ]),
    ]),
  };
  const foot = el("div", { class: "booking-foot" }, [footTotal, continueBtn]);

  const dialog = el("dialog", { class: "booking", "aria-labelledby": "booking-title" }, [
    el("div", { class: "booking-head" }, [
      backBtn,
      el("div", { class: "booking-progress", "aria-hidden": "true" }, progress),
      closeBtn,
    ]),
    stepLabel,
    title,
    el("div", { class: "booking-body" }, Object.values(steps)),
    foot,
  ]);

  // Escape key
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeBooking();
  });
  dialog.addEventListener("close", () => document.documentElement.classList.remove("no-scroll"));
  // Close when clicking the dark backdrop outside the window
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
    if (!inside) closeBooking();
  });

  document.body.append(dialog);

  const tabs = buildTabs(tabList, "booking", (catId) => {
    serviceList.replaceChildren(
      ...servicesIn(catId).map((service) =>
        el(
          "button",
          {
            type: "button",
            class: "choice",
            "aria-pressed": booking.service === service,
            onclick: (event) => {
              booking.service = service;
              serviceList
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

  function updateFoot() {
    const { service } = booking;
    footTotal.textContent = service ? `${service.name} · ${formatPrice(service.price)} · ${formatDuration(service.mins)}` : "";
    continueBtn.disabled = !service;
  }

  return { dialog, steps, tabs, summary, proNote, handoffStatus, freshaBtn, title, stepLabel, progress, backBtn, foot, updateFoot };
}

const STEPS = {
  service: { label: "Step 1 of 2", title: "Select a service", progress: 50 },
  review: { label: "Step 2 of 2", title: "Review and continue", progress: 100 },
};

function showStep(step) {
  const ui = bookingUI;
  const info = STEPS[step];
  Object.entries(ui.steps).forEach(([name, node]) => (node.hidden = name !== step));
  ui.stepLabel.textContent = info.label;
  ui.title.textContent = info.title;
  ui.progress.style.width = `${info.progress}%`;
  ui.backBtn.disabled = booking.history.length <= 1;
  ui.foot.hidden = step !== "service";

  if (step === "service") {
    ui.tabs.select(booking.service ? booking.service.cats[0] : "popular");
    ui.updateFoot();
  }

  if (step === "review") {
    const { service, pro } = booking;
    ui.summary.replaceChildren(
      ...[
        ["Service", service.name],
        ["Duration", formatDuration(service.mins)],
        ["Price", formatPrice(service.price)],
      ].flatMap(([label, value]) => [el("dt", { text: label }), el("dd", { text: value })])
    );
    ui.proNote.textContent = pro
      ? `When Fresha asks you to select a professional, choose ${pro.name}.`
      : "You can choose a specific professional, or any professional for the most availability.";
    ui.freshaBtn.href = freshaLink(service);
    ui.handoffStatus.textContent = "";
  }

  ui.dialog.querySelector(".booking-body").scrollTop = 0;
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

function openBooking({ service = null, pro = null, skipToReview = false } = {}) {
  if (!bookingUI) bookingUI = createBookingUI();
  booking.service = service || SERVICES.find((s) => s.id === DEFAULT_SERVICE_ID) || null;
  booking.pro = pro;
  booking.history = [];

  if (skipToReview) {
    booking.history.push("service");
    goTo("review");
  } else {
    goTo("service");
  }
  bookingUI.dialog.showModal();
  document.documentElement.classList.add("no-scroll");
}

function closeBooking() {
  if (bookingUI.dialog.open) bookingUI.dialog.close();
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
