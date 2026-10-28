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

// Booking form: check fields and show a confirmation message.
// Nothing is sent anywhere yet; hook this up to email/WhatsApp/a booking tool later.
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

  const name = form.name.value.trim().split(" ")[0];
  message.textContent = `Thanks ${name}! We'll be in touch to confirm your ${form.service.value} on ${form.date.value} at ${form.time.value}.`;
  message.className = "form-message success";
  form.reset();
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();
