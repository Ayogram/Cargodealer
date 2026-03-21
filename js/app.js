const STATUSES = [
  "Booking Confirmed",
  "Pickup Scheduled",
  "Picked Up",
  "In Transit",
  "Arrived at Destination Hub",
  "Delivered"
];

// Live tracking endpoint logic

const modal = document.getElementById("trackModal");
const openers = document.querySelectorAll("[data-open-track]");
const closeModalBtn = document.getElementById("closeModal");

function openTrackModal(prefill = "") {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  const inp = document.getElementById("trackingInputModal");
  inp.value = prefill || document.getElementById("trackingInput").value || "";
  inp.focus();
  renderEmpty();
}

function closeTrackModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

openers.forEach(el => el.addEventListener("click", (e) => {
  e.preventDefault();
  openTrackModal();
}));

closeModalBtn.addEventListener("click", closeTrackModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeTrackModal();
});

document.querySelectorAll(".qa").forEach(el => {
  el.addEventListener("click", () => {
    const target = el.getAttribute("data-jump");
    if (!target) return;
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const trackBtn = document.getElementById("trackBtn");
const trackInput = document.getElementById("trackingInput");

trackBtn.addEventListener("click", () => {
  openTrackModal(trackInput.value.trim());
  runTrack();
});
document.getElementById("trackBtnModal").addEventListener("click", runTrack);

document.getElementById("trackingInputModal").addEventListener("keydown", (e) => {
  if (e.key === "Enter") runTrack();
});
trackInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    openTrackModal(trackInput.value.trim());
    runTrack();
  }
});

function isValidTracking(id) {
  return /^CDI-\d{6}$/.test(id);
}

function renderEmpty() {
  document.getElementById("summary").style.display = "none";
  document.getElementById("trackHelp").innerHTML =
    'Enter a valid Tracking ID in the format <b>CDI-XXXXXX</b>. Try: <b>CDI-102938</b>';
  document.getElementById("staffNote").textContent = "—";
  renderTimeline(-1);
}

function renderTimeline(currentIndex) {
  const wrap = document.getElementById("timeline");
  wrap.innerHTML = "";
  STATUSES.forEach((name, idx) => {
    const step = document.createElement("div");
    step.className = "step";
    if (currentIndex >= 0 && idx < currentIndex) step.classList.add("done");
    if (idx === currentIndex) step.classList.add("current");

    const node = document.createElement("div");
    node.className = "node";

    const content = document.createElement("div");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = name;

    const desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = (idx === currentIndex)
      ? "Current milestone (last scan recorded)."
      : (idx < currentIndex ? "Completed." : "Pending.");

    content.appendChild(title);
    content.appendChild(desc);

    step.appendChild(node);
    step.appendChild(content);
    wrap.appendChild(step);
  });
}

async function runTrack() {
  const id = document.getElementById("trackingInputModal").value.trim().toUpperCase();
  const help = document.getElementById("trackHelp");

  if (!isValidTracking(id)) {
    help.innerHTML = 'Invalid ID. Use <b>CDI-XXXXXX</b> (6 digits). Example: <b>CDI-102938</b>';
    document.getElementById("summary").style.display = "none";
    document.getElementById("staffNote").textContent = "—";
    renderTimeline(-1);
    return;
  }

  help.innerHTML = 'Searching for shipment...';
  
  try {
    const res = await fetch(`/api/track/${id}`);
    if (!res.ok) {
      help.innerHTML = 'No shipment found for <b>' + id + '</b>. If you believe this is an error, contact support.';
      document.getElementById("summary").style.display = "none";
      document.getElementById("staffNote").textContent = "—";
      renderTimeline(-1);
      return;
    }
    
    const rec = await res.json();
    
    help.innerHTML = 'Shipment found. Displaying latest timeline and staff notes.';
    document.getElementById("summary").style.display = "grid";
    document.getElementById("s_tracking").textContent = rec.trackingId;
    document.getElementById("s_service").textContent = rec.service;
    document.getElementById("s_route").textContent = rec.route;
    
    // Format updated date nicely
    const updatedDate = new Date(rec.updatedAt || rec.createdAt);
    document.getElementById("s_updated").textContent = updatedDate.toLocaleString();
    
    document.getElementById("staffNote").textContent = rec.staffNote;
    renderTimeline(rec.currentIndex);
  } catch (err) {
    console.error(err);
    help.innerHTML = 'Network error fetching tracking details. Please try again.';
  }
}

document.getElementById("quoteBtn").addEventListener("click", () => {
  alert("Prototype: This will open the multi-step Get Quote wizard in Webflow.");
});
document.getElementById("bookBtn").addEventListener("click", () => {
  alert("Prototype: This will open Book Shipment (and optionally prefill from QuoteRef).");
});
document.getElementById("loginBtn").addEventListener("click", () => {
  window.location.href = "login.html";
});
document.getElementById("dealerBtn").addEventListener("click", () => {
  window.location.href = "dealer.html";
});

renderEmpty();
