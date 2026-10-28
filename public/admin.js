// Staff page: lists upcoming bookings and lets staff cancel them.
// The admin password is the ADMIN_KEY environment variable on Netlify. It's kept only for
// this browser tab (sessionStorage) and sent to the booking server with each request.
import { DAY_NAMES, fromMinutes, shopNow, weekdayOf } from "./shop-data.js";

const KEY_STORAGE = "chaps-admin-key";
const loginForm = document.getElementById("admin-login");
const area = document.getElementById("admin-area");
const daysEl = document.getElementById("admin-days");
const message = document.getElementById("admin-message");
const updated = document.getElementById("admin-updated");

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) if (child !== null && child !== undefined) node.append(child);
  return node;
}

const getKey = () => {
  try {
    return sessionStorage.getItem(KEY_STORAGE);
  } catch {
    return memoryKey;
  }
};
let memoryKey = null;
const setKey = (key) => {
  memoryKey = key;
  try {
    key ? sessionStorage.setItem(KEY_STORAGE, key) : sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    // Storage blocked: keep the key in memory for this page only
  }
};

function showLogin(text = "") {
  setKey(null);
  area.hidden = true;
  loginForm.hidden = false;
  message.textContent = text;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { Accept: "application/json", Authorization: `Bearer ${getKey()}`, ...(options.headers || {}) },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    showLogin("Wrong admin password.");
    throw new Error("unauthorized");
  }
  if (!response.ok) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

const dayTitle = (dateKey) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const label = `${DAY_NAMES[weekdayOf(dateKey)]} ${d}/${String(m).padStart(2, "0")}/${y}`;
  return dateKey === shopNow().dateKey ? `Today · ${label}` : label;
};

function renderDays(days) {
  daysEl.replaceChildren(
    ...days.map(({ date, bookings }) => {
      const active = bookings.filter((b) => b.status !== "cancelled").length;
      return el("section", { class: "admin-day" }, [
        el("h3", { text: `${dayTitle(date)} · ${active} booking${active === 1 ? "" : "s"}` }),
        bookings.length
          ? el(
              "div",
              { class: "admin-scroll" },
              el("table", { class: "admin-table" }, [
                el(
                  "thead",
                  {},
                  el(
                    "tr",
                    {},
                    ["Time", "Service", "Barber", "Customer", "Phone", "Email", "Note", "Ref", ""].map((h) => el("th", { text: h }))
                  )
                ),
                el(
                  "tbody",
                  {},
                  bookings.map((b) =>
                    el("tr", { class: b.status === "cancelled" ? "cancelled" : "" }, [
                      el("td", { text: `${b.time}–${fromMinutes(b.end)}` }),
                      el("td", { text: `${b.serviceName} (R${b.price})` }),
                      el("td", { text: b.anyPro ? `${b.proName} (any)` : b.proName }),
                      el("td", { text: b.name }),
                      el("td", {}, el("a", { href: `tel:${b.phone.replace(/[^0-9+]/g, "")}`, text: b.phone })),
                      el("td", {}, b.email ? el("a", { href: `mailto:${b.email}`, text: b.email }) : ""),
                      el("td", { text: b.note || "" }),
                      el("td", {}, [
                        b.ref,
                        el("span", {
                          class: "admin-cal",
                          text: b.calendarEventId ? "In Google Calendar" : "Not in calendar",
                        }),
                      ]),
                      el(
                        "td",
                        {},
                        b.status === "cancelled"
                          ? el("span", { class: "muted small", text: "Cancelled" })
                          : el("button", {
                              type: "button",
                              class: "btn btn-small btn-ghost-dark",
                              text: "Cancel",
                              onclick: (event) => cancelBooking(date, b, event.currentTarget),
                            })
                      ),
                    ])
                  )
                ),
              ])
            )
          : el("p", { class: "admin-empty", text: "No bookings." }),
      ]);
    })
  );
}

async function loadBookings() {
  message.textContent = "";
  updated.textContent = "Loading…";
  try {
    const data = await api(`/api/admin/bookings?from=${shopNow().dateKey}&days=14`);
    loginForm.hidden = true;
    area.hidden = false;
    renderDays(data.days);
    updated.textContent = `Updated ${new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}`;
  } catch (error) {
    updated.textContent = "";
    if (error.message !== "unauthorized") message.textContent = error.message;
  }
}

async function cancelBooking(date, b, button) {
  if (!confirm(`Cancel ${b.name}'s ${b.serviceName} at ${b.time}? The time becomes free for others.`)) return;
  button.disabled = true;
  try {
    await api("/api/admin/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, ref: b.ref }),
    });
    await loadBookings();
  } catch (error) {
    button.disabled = false;
    if (error.message !== "unauthorized") message.textContent = error.message;
  }
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const key = loginForm.elements.key.value;
  if (!key) return;
  setKey(key);
  loginForm.reset();
  loadBookings();
});
document.getElementById("admin-refresh").addEventListener("click", loadBookings);
document.getElementById("admin-signout").addEventListener("click", () => showLogin());

if (getKey()) loadBookings();
