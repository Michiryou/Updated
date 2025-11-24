/* weelab_ems.js - Fixed version */

// ====== DB & state ======
let db = JSON.parse(localStorage.getItem("bookings")) || [];
let loggedIn = JSON.parse(localStorage.getItem("loggedIn")) || false;

// price table (per selection - you can adjust numbers)
const prices = {
  mainDishes: { Adobo: 1200, Caldereta: 1200, Menudo: 1800, Sinigang: 1700, KareKare: 1200 },
  sideDishes: { Rice: 1000, Lumpia: 1500, SweetSour: 1700, FruitSalad: 1100, CornSalad: 1700 },
  desserts: { "Ice Cream": 600, LecheFlan: 1800, Brownies: 1700, FruitTart: 900, "HaloHalo": 1000 },
  drinks: { Water: 1200, IcedTea: 1400, SoftDrinks: 1500, Juice: 1600, Coffee: 1700 }
};

const PER_HEAD = 150;
const STYLE_FEE = 3000;

// ====== INITIALIZATION ======
function initApp() {
  // Toggle login UI
  applyLoginUI();

  // Prepare style select if empty
  ensureStyleOptions();

  // Setup price auto calculation listeners
  setupAutoPriceCalculation();

  // Display bookings initially
  displayBookings();

  // Hook register/show/hide handlers if present
  const showRegister = document.getElementById("showRegister");
  const hideRegister = document.getElementById("hideRegister");
  if (showRegister) showRegister.onclick = () => document.getElementById("registerForm").style.display = "block";
  if (hideRegister) hideRegister.onclick = () => document.getElementById("registerForm").style.display = "none";
}

// Reflect loggedIn state to UI
function applyLoginUI() {
  if (loggedIn) {
    const liLogin = document.getElementById("btnLoginLi");
    if (liLogin) liLogin.style.display = "none";
    const logoutLi = document.getElementById("logoutLi");
    if (logoutLi) logoutLi.style.display = "block";
    document.querySelectorAll(".requires-login").forEach(el => el.style.display = "block");
    // show bookings nav button if exists
    const btnBookings = document.getElementById("btnBookings");
    if (btnBookings) btnBookings.style.display = "block";
  } else {
    const liLogin = document.getElementById("btnLoginLi");
    if (liLogin) liLogin.style.display = "block";
    const logoutLi = document.getElementById("logoutLi");
    if (logoutLi) logoutLi.style.display = "none";
    document.querySelectorAll(".requires-login").forEach(el => el.style.display = "none");
    const btnBookings = document.getElementById("btnBookings");
    if (btnBookings) btnBookings.style.display = "none";
  }
}

// Ensure style select has some defaults
function ensureStyleOptions() {
  const sel = document.getElementById("StyleInput");
  if (!sel) return;
  if (sel.options.length === 0) {
    const options = ["Standard", "Elegant", "Garden", "Minimal", "Custom"];
    options.forEach(opt => {
      const o = document.createElement("option");
      o.value = opt;
      o.text = opt;
      sel.appendChild(o);
    });
  }
}

// ====== PAGE SWITCHING ======
function showPage(pageId) {
  const pages = document.querySelectorAll(".page");
  pages.forEach(page => page.style.display = "none");
  const target = document.getElementById(pageId);
  if (target) target.style.display = "block";
  window.scrollTo(0,0);
}

// ====== SET SELECTION (homepage) ======
function selectSet(set) {
  const sets = {
    A: { mainDishes: ["Adobo"], sideDishes: ["Rice"], desserts: ["Ice Cream"], drinks: ["Water"] },
    B: { mainDishes: ["Caldereta"], sideDishes: ["Lumpia"], desserts: ["LecheFlan"], drinks: ["IcedTea"] },
    C: { mainDishes: ["Menudo"], sideDishes: ["SweetSour"], desserts: ["Brownies"], drinks: ["SoftDrinks"] }
  };

  const s = sets[set];
  if (!s) return;
  alert(`You selected Set ${set}`);
  showPage("bookingForm");

  ["mainDishes", "sideDishes", "desserts", "drinks"].forEach(cat => {
    // uncheck all
    document.querySelectorAll(`input[name="${cat}"]`).forEach(input => input.checked = false);
    // check the items in set
    s[cat].forEach(item => {
      const checkbox = document.querySelector(`input[name="${cat}"][value="${item}"]`);
      if (checkbox) checkbox.checked = true;
    });
  });

  calculatePrice();
}

// ====== AUTO PRICE SETUP ======
function setupAutoPriceCalculation() {
  // recalc when any dish checkbox changes
  ["mainDishes", "sideDishes", "desserts", "drinks"].forEach(cat => {
    document.querySelectorAll(`input[name="${cat}"]`).forEach(cb => {
      cb.removeEventListener("change", calculatePrice);
      cb.addEventListener("change", calculatePrice);
    });
  });

  // recalc when guests change
  const guestInput = document.getElementById("guestInput");
  if (guestInput) {
    guestInput.removeEventListener("input", calculatePrice);
    guestInput.addEventListener("input", calculatePrice);
  }
}

// ====== PRICE CALCULATION ======
function calculatePrice() {
  const numGuests = parseInt(document.getElementById("guestInput").value) || 0;
  let total = 0;

  ["mainDishes", "sideDishes", "desserts", "drinks"].forEach(cat => {
    document.querySelectorAll(`input[name="${cat}"]:checked`).forEach(input => {
      // guard against unknown items
      const price = (prices[cat] && prices[cat][input.value]) ? prices[cat][input.value] : 0;
      total += price;
    });
  });

  total += (PER_HEAD * numGuests) + STYLE_FEE;

  // write to the label that exists in your HTML: #packagePriceLabel
  let priceLabel = document.getElementById("packagePriceLabel");
  if (!priceLabel) {
    // fallback: create if missing
    priceLabel = document.createElement("label");
    priceLabel.id = "packagePriceLabel";
    priceLabel.style.fontWeight = "600";
    priceLabel.style.color = "#6c63ff";
    priceLabel.style.display = "block";
    priceLabel.style.marginTop = "15px";
    const form = document.querySelector(".Form-input");
    if (form) form.insertBefore(priceLabel, form.querySelector(".btnsave"));
  }
  priceLabel.textContent = `Total: ₱${total}`;

  return total;
}

// ====== VALIDATION HELPERS ======
function validName(name) {
  return /^[A-Za-z\s]+$/.test(name.trim());
}
function validContact(contact) {
  // Accepts 09XXXXXXXXX or +639XXXXXXXXX or digits only length 10-13
  const c = contact.trim();
  return /^(09\d{9}|\+639\d{9}|\d{10,13})$/.test(c);
}
function validFutureDate(dateString) {
  if (!dateString) return false;
  const inputDate = new Date(dateString);
  const today = new Date();
  // zero time to compare only date portion
  today.setHours(0,0,0,0);
  inputDate.setHours(0,0,0,0);
  return inputDate >= today;
}

// ====== SAVE BOOKING ======
function saveBook() {
  // basic validation
  const name = (document.getElementById("nameInput") || {}).value || "";
  const email = (document.getElementById("emailInput") || {}).value || "";
  const contact = (document.getElementById("contactInput") || {}).value || "";
  const eventDate = (document.getElementById("eventDateInput") || {}).value || "";
  const venue = (document.getElementById("eventVenueInput") || {}).value || "";
  const guests = (document.getElementById("guestInput") || {}).value || "";
  const style = (document.getElementById("StyleInput") || {}).value || "";

  if (!validName(name)) { alert("Please enter a valid name (letters and spaces only)."); return; }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) { alert("Please enter a valid email."); return; }
  if (!validContact(contact)) { alert("Please enter a valid contact (09XXXXXXXXX or +639XXXXXXXXX)."); return; }
  if (!validFutureDate(eventDate)) { alert("Please choose a valid event date (today or later)."); return; }
  if (!venue) { alert("Please enter the event venue."); return; }
  if (!(parseInt(guests) > 0)) { alert("Please enter the number of guests."); return; }

  if(!confirm("Are you sure about your selections?")) return;

  const booking = {
    name: name.trim(),
    email: email.trim(),
    contact: contact.trim(),
    eventDate,
    venue: venue.trim(),
    guests: parseInt(guests),
    style,
    mainDishes: Array.from(document.querySelectorAll('input[name="mainDishes"]:checked')).map(el => el.value),
    sideDishes: Array.from(document.querySelectorAll('input[name="sideDishes"]:checked')).map(el => el.value),
    desserts: Array.from(document.querySelectorAll('input[name="desserts"]:checked')).map(el => el.value),
    drinks: Array.from(document.querySelectorAll('input[name="drinks"]:checked')).map(el => el.value)
  };

  booking.total = calculatePrice();

  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  bookings.push(booking);
  localStorage.setItem("bookings", JSON.stringify(bookings));
  db = bookings;

  alert("Booking saved successfully!");

  // reset form & price label
  const form = document.querySelector("#bookingForm form");
  if (form) form.reset();
  const priceLabel = document.getElementById("packagePriceLabel");
  if (priceLabel) priceLabel.textContent = "Total: ₱0";

  showPage("bookings");
  displayBookings();
}

// ====== DISPLAY BOOKINGS ======
function displayBookings(passedSearch = "") {
  const container = document.getElementById("cardsContainer");
  if (!container) return;
  container.innerHTML = "";

  // Determine search text from argument or from input
  let searchText = (typeof passedSearch === "string" && passedSearch.length) ? passedSearch : "";
  const inputEl = document.getElementById("searchInput");
  if (!searchText && inputEl) searchText = inputEl.value.trim();

  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  if (searchText) {
    bookings = bookings.filter(b => (b.name || "").toLowerCase().includes(searchText.toLowerCase()));
  }

  if (bookings.length === 0) {
    container.innerHTML = "<p>No bookings found.</p>";
    return;
  }

  bookings.forEach((b, index) => {
    const card = document.createElement("div");
    card.className = "card";

    const mainList = (b.mainDishes && b.mainDishes.length) ? b.mainDishes.join(", ") : "—";
    const sideList = (b.sideDishes && b.sideDishes.length) ? b.sideDishes.join(", ") : "—";
    const dessertList = (b.desserts && b.desserts.length) ? b.desserts.join(", ") : "—";
    const drinkList = (b.drinks && b.drinks.length) ? b.drinks.join(", ") : "—";

    card.innerHTML = `
      <h3>Event Details</h3>
      <p><strong>Name:</strong> ${escapeHtml(b.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(b.email)}</p>
      <p><strong>Contact:</strong> ${escapeHtml(b.contact)}</p>
      <p><strong>Event Date:</strong> ${escapeHtml(b.eventDate)}</p>
      <p><strong>Venue:</strong> ${escapeHtml(b.venue)}</p>
      <p><strong>No. of Guests:</strong> ${escapeHtml(b.guests)}</p>
      <p><strong>Style:</strong> ${escapeHtml(b.style)}</p>
      <p><strong>Main:</strong> ${escapeHtml(mainList)}</p>
      <p><strong>Sides:</strong> ${escapeHtml(sideList)}</p>
      <p><strong>Desserts:</strong> ${escapeHtml(dessertList)}</p>
      <p><strong>Drinks:</strong> ${escapeHtml(drinkList)}</p>
      <div class="card-btns">
        <button onclick="editBooking(${index})">Edit</button>
        <button onclick="deleteBooking(${index})">Delete</button>
        <button onclick="checkoutBooking(${index})">Checkout</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// small helper to avoid XSS-ish injection in template
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'", "&#039;");
}

// ====== EDIT/DELETE/VIEW ======
function editBooking(index) {
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  const b = bookings[index];
  if (!b) { alert("Booking not found"); return; }

  // populate fields
  document.getElementById("nameInput").value = b.name || "";
  document.getElementById("emailInput").value = b.email || "";
  document.getElementById("contactInput").value = b.contact || "";
  document.getElementById("eventDateInput").value = b.eventDate || "";
  document.getElementById("eventVenueInput").value = b.venue || "";
  document.getElementById("guestInput").value = b.guests || "";
  document.getElementById("StyleInput").value = b.style || "";

  // clear all checkboxes then restore
  ["mainDishes", "sideDishes", "desserts", "drinks"].forEach(cat => {
    document.querySelectorAll(`input[name="${cat}"]`).forEach(cb => cb.checked = false);
    if (Array.isArray(b[cat])) {
      b[cat].forEach(item => {
        const cb = document.querySelector(`input[name="${cat}"][value="${item}"]`);
        if (cb) cb.checked = true;
      });
    }
  });

  // remove the original entry so save will re-add it (acts as edit)
  bookings.splice(index, 1);
  localStorage.setItem("bookings", JSON.stringify(bookings));
  db = bookings;

  // recalc price and show form
  calculatePrice();
  showPage("bookingForm");
}

function deleteBooking(idx) {
  if (!confirm("Are you sure you want to delete this booking?")) return;
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  if (idx < 0 || idx >= bookings.length) return;
  bookings.splice(idx, 1);
  localStorage.setItem("bookings", JSON.stringify(bookings));
  db = bookings;
  displayBookings();
}

function checkoutBooking(index) {
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  const booking = bookings[index];
  if (!booking) { alert("Booking not found"); return; }
  // proceed to show receipt (we leave the booking in storage)
  showReceipt(booking);
}

// ====== RECEIPT DISPLAY (builds HTML inside #receiptContent) ======
function showReceipt(booking) {
  const container = document.getElementById("receiptContent");
  if (!container) { alert("Receipt container missing in HTML."); return; }

  // Build itemized list and total
  let total = 0;
  let itemsHtml = "<ul id='recItems'>";
  ['mainDishes', 'sideDishes', 'desserts', 'drinks'].forEach(cat => {
    if (booking[cat] && booking[cat].length) {
      booking[cat].forEach(item => {
        const price = (prices[cat] && prices[cat][item]) ? prices[cat][item] : 0;
        total += price;
        itemsHtml += `<li>${escapeHtml(item)} - ₱${price}</li>`;
      });
    }
  });

  const numGuests = parseInt(booking.guests) || 0;
  const perHeadTotal = PER_HEAD * numGuests;
  total += perHeadTotal + STYLE_FEE;

  itemsHtml += `<li>Per Head (${numGuests} x ₱${PER_HEAD}) - ₱${perHeadTotal}</li>`;
  itemsHtml += `<li>Style Fee - ₱${STYLE_FEE}</li>`;
  itemsHtml += "</ul>";

  const html = `
    <h2>Receipt</h2>
    <p><strong>Name:</strong> ${escapeHtml(booking.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(booking.email)}</p>
    <p><strong>Contact:</strong> ${escapeHtml(booking.contact)}</p>
    <p><strong>Event Date:</strong> ${escapeHtml(booking.eventDate)}</p>
    <p><strong>Venue:</strong> ${escapeHtml(booking.venue)}</p>
    <p><strong>Guests:</strong> ${escapeHtml(booking.guests)}</p>
    <p><strong>Style:</strong> ${escapeHtml(booking.style)}</p>
    <h3>Items</h3>
    ${itemsHtml}
    <p id="recTotal"><strong>Total:</strong> ₱${total}</p>
    <button onclick="showPage('frontPage')">Back to Home</button>
  `;

  container.innerHTML = html;
  showPage('receiptPage');
}

// ====== SIMPLE AUTH (localStorage-based) ======
function ensureUsers() {
  let users = JSON.parse(localStorage.getItem("weelab_users")) || null;
  if (!users) {
    // create a default admin user (username: admin, pass: admin123)
    users = [{ username: "admin", password: "admin123" }];
    localStorage.setItem("weelab_users", JSON.stringify(users));
  }
  return users;
}

function login() {
  ensureUsers();
  const u = document.getElementById("loginUser")?.value || "";
  const p = document.getElementById("loginPass")?.value || "";
  if (!u || !p) { alert("Enter username & password"); return; }
  const users = JSON.parse(localStorage.getItem("weelab_users")) || [];
  const found = users.find(x => x.username === u && x.password === p);
  if (found) {
    loggedIn = true;
    localStorage.setItem("loggedIn", JSON.stringify(true));
    applyLoginUI();
    alert("Logged in!");
    showPage("frontPage");
  } else {
    alert("Invalid credentials.");
  }
}

function register() {
  const newUser = document.getElementById("regUser")?.value || "";
  const newPass = document.getElementById("regPass")?.value || "";
  if (!newUser || !newPass) { alert("Please enter username and password"); return; }
  let users = JSON.parse(localStorage.getItem("weelab_users")) || [];
  if (users.find(x => x.username === newUser)) { alert("Username already exists"); return; }
  users.push({ username: newUser, password: newPass });
  localStorage.setItem("weelab_users", JSON.stringify(users));
  alert("Registered successfully! Please login.");
  document.getElementById("registerForm").style.display = "none";
}

function logout() {
  if (!confirm("Log out?")) return;
  loggedIn = false;
  localStorage.setItem("loggedIn", JSON.stringify(false));
  applyLoginUI();
  alert("Logged out");
  showPage("frontPage");
}

// ====== Search input event hookup (optional helper) ======
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", () => displayBookings());
}

// Make init run when script loads (body has onload too, but this ensures it if needed)
window.addEventListener("DOMContentLoaded", initApp);
