// ============ Menu data ============
const RECIPIENT = "Renei";

const SERVICES = [
  { id: "swedish", name: "Swedish Relaxation",      meta: "60 min · soothing full body", mins: 60,  cost: 100 },
  { id: "deep",    name: "Deep Tissue",             meta: "60 min · knots & tension",    mins: 60,  cost: 120 },
  { id: "back",    name: "Back, Neck & Shoulders",  meta: "30 min · a quick reset",      mins: 30,  cost: 60  },
  { id: "full",    name: "The Royal Treatment",     meta: "90 min · the full works",     mins: 90,  cost: 180 },
];
const ADDONS = [
  { id: "feet",  name: "Foot rub" },
  { id: "scalp", name: "Scalp massage" },
  { id: "oil",   name: "Warm aromatherapy oil" },
  { id: "hot",   name: "Hot towel finish" },
];
const ADDON_COST = 25;
const ADDON_MINS = 10;
const CURRENCY = "♥";

const QUOTES = [
  "You deserve to be taken care of.",
  "An hour where the world waits for you.",
  "Loved, head to toe.",
  "Relax — you're in good hands.",
];

let selectedService = null;
const selectedAddons = new Set();

// ============ Render options ============
const servicesEl = document.getElementById("services");
SERVICES.forEach((s) => {
  const el = document.createElement("label");
  el.className = "option";
  el.innerHTML = `
    <input type="radio" name="service" value="${s.id}" />
    <div class="o-title">${s.name}</div>
    <div class="o-meta">${s.meta}</div>
    <div class="o-price">${s.cost} ${CURRENCY}</div>`;
  el.querySelector("input").addEventListener("change", () => {
    selectedService = s.id;
    document.querySelectorAll("#services .option").forEach((o) => o.classList.remove("selected"));
    el.classList.add("selected");
    updateSummary();
    updateProgress();
  });
  servicesEl.appendChild(el);
});

const addonsEl = document.getElementById("addons");
ADDONS.forEach((a) => {
  const el = document.createElement("label");
  el.className = "option";
  el.innerHTML = `
    <input type="checkbox" value="${a.id}" />
    <div class="o-title">${a.name}</div>
    <div class="o-price">+${ADDON_COST} ${CURRENCY}</div>`;
  el.querySelector("input").addEventListener("change", (e) => {
    if (e.target.checked) { selectedAddons.add(a.id); el.classList.add("selected"); }
    else { selectedAddons.delete(a.id); el.classList.remove("selected"); }
    updateSummary();
  });
  addonsEl.appendChild(el);
});

// ============ Helpers ============
const svc = () => SERVICES.find((x) => x.id === selectedService);
const addonNames = () => [...selectedAddons].map((id) => ADDONS.find((a) => a.id === id).name);
function totalMins() { return (svc() ? svc().mins : 0) + selectedAddons.size * ADDON_MINS; }
function totalCost() { return (svc() ? svc().cost : 0) + selectedAddons.size * ADDON_COST; }

function fmtMins(m) {
  const h = Math.floor(m / 60), mm = m % 60;
  return (h ? h + "h " : "") + (mm ? mm + "m" : (h ? "" : "0m"));
}
function endTime() {
  const d = document.getElementById("date").value;
  const t = document.getElementById("time").value;
  if (!d || !t || !svc()) return "—";
  const start = new Date(d + "T" + t);
  const end = new Date(start.getTime() + totalMins() * 60000);
  return end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// ============ Summary & progress ============
function updateSummary() {
  document.getElementById("sumService").textContent = svc() ? svc().name : "—";
  document.getElementById("sumDuration").textContent = svc() ? fmtMins(totalMins()) : "—";
  document.getElementById("sumEnd").textContent = endTime();
  const a = addonNames();
  document.getElementById("sumAddons").textContent = a.length ? a.join(", ") : "None";
  document.getElementById("sumTotal").textContent = totalCost() + " " + CURRENCY;
}
function updateProgress() {
  const dots = document.querySelectorAll(".progress .dot");
  const name = document.getElementById("name").value.trim();
  const dateOk = document.getElementById("date").value && document.getElementById("time").value;
  const steps = [!!selectedService, !!selectedService, !!(selectedService && name && dateOk)];
  dots.forEach((d, i) => d.classList.toggle("active", steps[i]));
}

// react to detail changes
["date", "time", "name"].forEach((id) =>
  document.getElementById(id).addEventListener("input", () => { updateSummary(); updateProgress(); })
);
const notes = document.getElementById("notes");
notes.addEventListener("input", () => { document.getElementById("counter").textContent = notes.value.length; });

// default date = today
const dateInput = document.getElementById("date");
const today = new Date().toISOString().split("T")[0];
dateInput.value = today; dateInput.min = today;

// ============ Submit ============
const form = document.getElementById("bookingForm");
const errorEl = document.getElementById("error");
let lastBooking = null;

function flagInvalid(el) { el.classList.add("invalid"); el.focus(); setTimeout(() => el.classList.remove("invalid"), 600); }

form.addEventListener("submit", (e) => {
  e.preventDefault();
  errorEl.textContent = "";
  const nameEl = document.getElementById("name");
  const name = nameEl.value.trim();

  if (!selectedService) { errorEl.textContent = "Please choose a treatment first ♥"; document.getElementById("services").scrollIntoView({behavior:"smooth",block:"center"}); return; }
  if (!name) { errorEl.textContent = "Don't forget your name ♥"; flagInvalid(nameEl); return; }
  if (!dateInput.value) { errorEl.textContent = "Pick a date ♥"; flagInvalid(dateInput); return; }
  if (!document.getElementById("time").value) { errorEl.textContent = "Pick a time ♥"; flagInvalid(document.getElementById("time")); return; }

  lastBooking = {
    ref: "RENEI-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    name,
    service: svc().name,
    duration: fmtMins(totalMins()),
    addons: addonNames(),
    pressure: document.getElementById("pressure").value,
    location: document.getElementById("location").value,
    occasion: document.getElementById("occasion").value,
    date: dateInput.value,
    time: document.getElementById("time").value,
    end: endTime(),
    notes: document.getElementById("notes").value.trim(),
    total: totalCost(),
    quote: QUOTES[Math.floor(Math.random() * QUOTES.length)],
    bookedAt: new Date().toLocaleString(),
  };

  showConfirmation(lastBooking);
});

// ============ Confirmation ============
function showConfirmation(b) {
  form.classList.add("hidden");
  const conf = document.getElementById("confirmation");
  conf.classList.remove("hidden");

  document.getElementById("confirmHeading").textContent = `You're booked, ${b.name}!`;
  const niceDate = new Date(b.date + "T" + b.time)
    .toLocaleString(undefined, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
  document.getElementById("confirmText").textContent =
    `${b.service} · ${niceDate}. ${b.quote} ♥`;

  // countdown
  const days = Math.ceil((new Date(b.date + "T" + b.time) - new Date()) / 86400000);
  const cd = document.getElementById("countdown");
  cd.textContent = days <= 0 ? "Today is the day ♥" : days === 1 ? "1 day to go ♥" : `${days} days to go ♥`;

  // ticket
  const ticket = document.getElementById("ticket");
  const rows = [
    ["For", b.name],
    ["Treatment", b.service],
    ["Add-ons", b.addons.length ? b.addons.join(", ") : "None"],
    ["Pressure", b.pressure],
    ["Where", b.location],
    ["Occasion", b.occasion],
    ["Date", new Date(b.date + "T" + b.time).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })],
    ["Time", b.time + " – " + b.end],
    ["Booking ref", b.ref],
  ];
  ticket.innerHTML =
    rows.map(([k, v]) => `<div class="t-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join("") +
    (b.notes ? `<div class="t-row"><span class="k">Note</span><span class="v">“${b.notes}”</span></div>` : "") +
    `<div class="t-row t-total"><span class="k">Total</span><span class="v">${b.total} ♥ · with love</span></div>`;

  conf.scrollIntoView({ behavior: "smooth", block: "start" });
  confettiBurst();
}

// ============ Confetti ============
function confettiBurst() {
  const wrap = document.getElementById("burst");
  const chars = ["♥", "❀", "✿", "❁", "♡"];
  for (let i = 0; i < 28; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.textContent = chars[i % chars.length];
    c.style.left = 30 + Math.random() * 40 + "vw";
    c.style.color = Math.random() > .5 ? "#b8607c" : "#d98aa3";
    c.style.setProperty("--dx", (Math.random() * 400 - 200) + "px");
    c.style.setProperty("--dy", (Math.random() * -260 - 80) + "px");
    c.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
    c.style.animationDelay = Math.random() * 0.2 + "s";
    wrap.appendChild(c);
    setTimeout(() => c.remove(), 1900);
  }
}

// ============ Download voucher (JPG) ============
document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!lastBooking) return;
  const b = lastBooking;
  const scale = 2, W = 620, H = 880;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#fdeef2"); grad.addColorStop(1, "#f3d9e3");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  const pad = 34;
  ctx.fillStyle = "#fffdfb"; ctx.strokeStyle = "#ecb3c4"; ctx.lineWidth = 2;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 24); ctx.fill(); ctx.stroke();

  const cx = W / 2; let y = pad + 56;
  ctx.textAlign = "center";
  ctx.fillStyle = "#b8607c"; ctx.font = "italic 700 30px Georgia, serif";
  ctx.fillText("A Massage, For " + b.name, cx, y); y += 26;
  ctx.fillStyle = "#9a8189"; ctx.font = "600 12px Arial, sans-serif";
  ctx.fillText("L O V E   V O U C H E R", cx, y); y += 14;
  dashLine(ctx, pad + 28, W - pad - 28, y + 8, "#ecb3c4"); y += 40;

  ctx.textAlign = "left";
  const lx = pad + 32, rx = W - pad - 32;
  const row = (label, value) => {
    ctx.fillStyle = "#9a8189"; ctx.font = "700 13px Arial, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(label.toUpperCase(), lx, y);
    ctx.fillStyle = "#4a3b41"; ctx.font = "400 16px Arial, sans-serif"; ctx.textAlign = "right";
    ctx.fillText(value, rx, y); ctx.textAlign = "left"; y += 30;
  };
  row("Treatment", b.service);
  row("Duration", b.duration + "  (ends " + b.end + ")");
  row("Add-ons", b.addons.length ? b.addons.join(", ") : "None");
  row("Pressure", b.pressure);
  row("Where", b.location);
  row("Occasion", b.occasion);
  row("Date", new Date(b.date + "T" + b.time).toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}));
  row("Time", b.time);
  row("Booking ref", b.ref);

  if (b.notes) {
    y += 4;
    ctx.fillStyle = "#9a8189"; ctx.font = "700 13px Arial, sans-serif"; ctx.fillText("NOTE", lx, y); y += 22;
    ctx.fillStyle = "#4a3b41"; ctx.font = "italic 15px Georgia, serif";
    y = wrapText(ctx, "“" + b.notes + "”", lx, y, rx - lx, 21);
  }

  y += 12; dashLine(ctx, pad + 28, W - pad - 28, y, "#ecb3c4"); y += 38;

  ctx.fillStyle = "#fff5f7"; roundRect(ctx, pad + 28, y - 28, W - (pad + 28) * 2, 52, 14); ctx.fill();
  ctx.fillStyle = "#b8607c"; ctx.font = "800 19px Arial, sans-serif";
  ctx.textAlign = "left"; ctx.fillText("TOTAL", lx + 6, y + 4);
  ctx.textAlign = "right"; ctx.fillText(b.total + " ♥", rx - 6, y + 4); y += 56;

  ctx.textAlign = "center";
  ctx.fillStyle = "#b8607c"; ctx.font = "italic 18px Georgia, serif";
  y = wrapText(ctx, "“" + b.quote + "”", pad + 40, y, W - (pad + 40) * 2, 24, true); y += 8;
  ctx.fillStyle = "#9a8189"; ctx.font = "italic 13px Georgia, serif";
  ctx.fillText("Redeemable anytime · no expiry · paid in full, with love", cx, y); y += 22;
  ctx.fillStyle = "#b8607c"; ctx.font = "600 14px Arial, sans-serif";
  ctx.fillText("Thank you for letting me take care of you. ♥", cx, y);

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/jpeg", 0.95);
  a.download = `massage-voucher-${b.ref}.jpg`;
  document.body.appendChild(a); a.click(); a.remove();
});

// canvas helpers
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function dashLine(ctx, x1, x2, y, color) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); ctx.restore();
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight, center) {
  const words = text.split(" "); let line = "";
  const startX = center ? x + maxWidth / 2 : x;
  if (center) ctx.textAlign = "center";
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), startX, y); line = w + " "; y += lineHeight;
    } else line = test;
  }
  ctx.fillText(line.trim(), startX, y);
  if (center) ctx.textAlign = "left";
  return y + lineHeight;
}

// ============ Book another ============
document.getElementById("againBtn").addEventListener("click", () => {
  form.reset();
  selectedService = null; selectedAddons.clear();
  document.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
  document.getElementById("name").value = RECIPIENT;
  dateInput.value = today; document.getElementById("time").value = "19:00";
  document.getElementById("counter").textContent = "0";
  updateSummary(); updateProgress();
  document.getElementById("confirmation").classList.add("hidden");
  form.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth" });
});

// ============ Button ripples ============
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("click", function (e) {
    const r = document.createElement("span");
    const d = Math.max(this.clientWidth, this.clientHeight);
    r.className = "ripple"; r.style.width = r.style.height = d + "px";
    const rect = this.getBoundingClientRect();
    r.style.left = e.clientX - rect.left - d / 2 + "px";
    r.style.top = e.clientY - rect.top - d / 2 + "px";
    this.appendChild(r); setTimeout(() => r.remove(), 600);
  });
});

// ============ Petals ============
(function petals() {
  const wrap = document.querySelector(".petals");
  const chars = ["❀", "✿", "♥", "❁"];
  for (let i = 0; i < 16; i++) {
    const p = document.createElement("div");
    p.className = "petal"; p.textContent = chars[i % chars.length];
    p.style.left = Math.random() * 100 + "vw";
    p.style.color = Math.random() > .5 ? "#d98aa3" : "#ecb3c4";
    p.style.animationDuration = 9 + Math.random() * 10 + "s";
    p.style.animationDelay = -Math.random() * 14 + "s";
    p.style.fontSize = 13 + Math.random() * 16 + "px";
    wrap.appendChild(p);
  }
})();

// ============ Scroll reveals ============
(function reveals() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach((e) => io.observe(e));
})();

// ============ Music playlist ============
const music = (function () {
  const audio = document.getElementById("music");
  const muteBtn = document.getElementById("muteBtn");
  const TRACKS = Array.from({ length: 7 }, (_, i) => `music/song${i + 1}.mp3`);
  let idx = 0, started = false;

  audio.addEventListener("ended", () => { idx = (idx + 1) % TRACKS.length; play(); });
  audio.addEventListener("error", () => { /* file missing — skip to next so the rest still works */
    if (started) { idx = (idx + 1) % TRACKS.length; if (idx !== 0) play(); }
  });

  function play() { audio.src = TRACKS[idx]; audio.play().catch(() => {}); }

  function start() {
    if (started) return; started = true;
    play();
    muteBtn.classList.remove("hidden");
  }

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.classList.toggle("muted", audio.muted);
    muteBtn.textContent = audio.muted ? "♪̶" : "♪";
  });

  return { start };
})();

// ============ Intro: tap to enter (starts music) ============
(function intro() {
  const splash = document.getElementById("intro");
  const page = document.getElementById("page");
  let entered = false;
  function enter() {
    if (entered) return; entered = true;
    music.start();
    splash.classList.add("fade-out");
    page.classList.add("revealed");
    setTimeout(() => splash.remove(), 1300);
  }
  splash.addEventListener("click", enter);
  splash.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") enter(); });
})();

// init
updateSummary();
updateProgress();
