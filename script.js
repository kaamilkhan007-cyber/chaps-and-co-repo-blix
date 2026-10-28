// ===== Shop settings: change these to your real details =====
// WhatsApp number in international format, digits only (e.g. 27821234567 for 082 123 4567)
const WHATSAPP_NUMBER = "27000000000";

// Opening hours used for the "Open now" badge. 0 = Sunday, 6 = Saturday. null = closed.
const OPENING_HOURS = {
  0: null,
  1: ["09:00", "18:00"],
  2: ["09:00", "18:00"],
  3: ["09:00", "18:00"],
  4: ["09:00", "18:00"],
  5: ["09:00", "18:00"],
  6: ["08:00", "15:00"],
};

const whatsappLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

// Mobile menu toggle
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});

// Close the menu after tapping a link
nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });
});

// Highlight the menu link for the section currently on screen
const navLinks = nav.querySelectorAll('a[href^="#"]:not(.btn)');
const sections = [...navLinks].map((link) => document.querySelector(link.getAttribute("href")));

function updateActiveLink() {
  const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
  // The current section is the last one whose top has passed a third of the way down the screen
  let current = atBottom ? sections.length - 1 : -1;
  if (!atBottom) {
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= window.innerHeight / 3) current = i;
    });
  }
  navLinks.forEach((link, i) => link.classList.toggle("active", i === current));
}
window.addEventListener("scroll", updateActiveLink, { passive: true });
updateActiveLink();

// Booking form: check fields, then open WhatsApp with the booking details filled in
const form = document.getElementById("book-form");
const message = document.getElementById("form-message");

// Don't allow dates in the past
form.date.min = new Date().toISOString().split("T")[0];

form.addEventListener("submit", (event) => {
  event.preventDefault();

  let valid = true;
  form.querySelectorAll("[required]").forEach((field) => {
    const ok = field.checkValidity();
    field.classList.toggle("invalid", !ok);
    if (!ok) valid = false;
  });

  if (!valid) {
    message.textContent = "Please fill in all the fields.";
    message.className = "form-message error";
    return;
  }

  const date = new Date(`${form.date.value}T00:00`).toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const text =
    `Hi Chaps & Co, I'd like to book a ${form.service.value} on ${date} at ${form.time.value}.\n` +
    `Name: ${form.name.value.trim()}\nPhone: ${form.phone.value.trim()}`;

  window.open(whatsappLink(text), "_blank", "noopener");

  const name = form.name.value.trim().split(" ")[0];
  message.textContent = `Thanks ${name}! Send the WhatsApp message that just opened and we'll confirm your booking.`;
  message.className = "form-message success";
  form.reset();
});

// Floating WhatsApp button
document.getElementById("whatsapp-float").href = whatsappLink("Hi Chaps & Co, ");

// "Open now" / "Closed" badge next to the opening hours
function updateOpenBadge() {
  const badge = document.getElementById("open-badge");
  const now = new Date();
  const hours = OPENING_HOURS[now.getDay()];
  const time = now.toTimeString().slice(0, 5);
  const open = hours && time >= hours[0] && time < hours[1];

  badge.textContent = open ? `Open now · until ${hours[1]}` : "Closed now";
  badge.classList.toggle("is-open", Boolean(open));
}
updateOpenBadge();
setInterval(updateOpenBadge, 60 * 1000);

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();
