let currentWeekStart = getMonday(new Date());
let selectedDate = new Date();
let allEvents = [];

const eventColors = [
  { bg: "bg-blue-600", text: "text-blue-100", border: "border-blue-500" },
  { bg: "bg-red-600", text: "text-red-100", border: "border-red-500" },
  { bg: "bg-green-600", text: "text-green-100", border: "border-green-500" },
  { bg: "bg-purple-600", text: "text-purple-100", border: "border-purple-500" },
  { bg: "bg-orange-600", text: "text-orange-100", border: "border-orange-500" },
  { bg: "bg-pink-600", text: "text-pink-100", border: "border-pink-500" },
  { bg: "bg-cyan-600", text: "text-cyan-100", border: "border-cyan-500" },
];

function getColorForEvent(index) {
  return eventColors[index % eventColors.length];
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDateForDisplay(date) {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(start.getDate() + 6);

  return `${start.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} - ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
}

function formatDateShort(date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getSameDayEvents(date) {
  const dateStr = new Date(date).toISOString().split("T")[0];
  return allEvents.filter((event) => {
    const eventDateStr = new Date(event.date).toISOString().split("T")[0];
    return eventDateStr === dateStr;
  });
}


function renderEventsOnGrid() {
  allEvents.forEach((event, idx) => {
    const eventDate = new Date(event.date);
    const weekStart = currentWeekStart;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    if (eventDate < weekStart || eventDate > weekEnd) return;

    const hour = parseInt((event.time || "09:00").split(":")[0]);
    if (hour < 8 || hour >= 18) return;

    const dateStr = eventDate.toISOString().split("T")[0];
    const slotId = `slot-${dateStr}-${hour}`;
    const slot = document.getElementById(slotId);

    if (!slot) return;

    const color = getColorForEvent(idx);

    const eventEl = document.createElement("div");
    eventEl.className = `${color.bg} ${color.text} ${color.border} border-l-4 rounded px-2 py-1 text-xs font-semibold cursor-pointer hover:shadow-lg transition mb-1 truncate`;
    eventEl.innerHTML = `
      <div class="truncate font-semibold">${event.title}</div>
      <div class="opacity-90 text-xs">${event.time}</div>
    `;
    eventEl.onclick = (e) => {
      e.stopPropagation();
      selectDate(event.date);
    };

    slot.appendChild(eventEl);
  });
}

function attachVoteHandlers() {
  document.querySelectorAll(".vote-btn").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();

      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert("Veuillez vous connecter pour voter");
        window.location.href = "login.html";
        return;
      }

      const eventId = button.dataset.eventId;
      try {
        const response = await fetch(
          `http://localhost:3000/api/events/${eventId}/vote`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: currentUser.id,
            }),
          },
        );

        if (response.ok) {
          loadCalendar();
        } else {
          const error = await response.json();
          alert(error.error || "Erreur lors du vote");
        }
      } catch (error) {
        console.error("Erreur lors du vote:", error);
        alert("Erreur lors du vote");
      }
    });
  });
}

function selectDate(date) {
  selectedDate = new Date(date);
  const dateStr = selectedDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  document.getElementById("selected-day-title").textContent =
    dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const dayEvents = getSameDayEvents(selectedDate);
  dayEvents.sort((a, b) => {
    return a.time.localeCompare(b.time, undefined, { numeric: true });
  });
  console.log("Événements du jour:", dayEvents);
  const eventsList = document.getElementById("day-events-list");

  if (dayEvents.length === 0) {
    eventsList.innerHTML =
      '<p class="text-slate-400 text-sm">Aucun événement ce jour</p>';
    document.getElementById("week-title").textContent =
      formatDateForDisplay(currentWeekStart);
  } else {
    eventsList.innerHTML = dayEvents
      .map((event, idx) => {
        const color = getColorForEvent(allEvents.indexOf(event));
        return `
          <div class="${color.bg} ${color.text} ${color.border} border-l-4 rounded-lg p-4">
            <div class="font-bold mb-1 flex items-center gap-2">
              <i class="bi bi-clock"></i>
              ${event.time || "09:00"}
            </div>
            <div class="font-semibold text-base mb-2">${event.title}</div>
            <div class="text-sm opacity-90 mb-2">${event.description}</div>
            <div class="text-xs opacity-75 mb-3 flex items-center gap-1">
              <i class="bi bi-geo-alt"></i>
              ${event.location}
            </div>
            <div class="flex gap-2">
              <button class="text-xs px-2 py-1 bg-slate-900 rounded hover:bg-slate-950 transition flex items-center gap-1" onclick="window.location.href='event-details.html?id=${event.id}'">
                <i class="bi bi-info-circle"></i>
                Détails
              </button>
              <button class="vote-btn text-xs px-2 py-1 bg-slate-900 rounded hover:bg-slate-950 transition flex items-center gap-1" data-event-id="${event.id}">
                <i class="bi bi-hand-thumbs-up"></i>
                ${event.votes ? event.votes.length : 0}
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    attachVoteHandlers();
  }
}

function createCalendarGrid() {
  const grid = document.getElementById("calendar-grid");

  document.getElementById("week-title").textContent =
    formatDateForDisplay(currentWeekStart);

  let html = '<div class="space-y-4">';

  html +=
    '<div class="grid grid-cols-8 gap-0 sticky top-0 bg-slate-900 z-10 border-b border-slate-700">';
  html += '<div class="p-3 bg-slate-950 text-xs font-semibold"></div>';

  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    const dayNum = date.getDate();
    const dayName = days[i];

    html += `
      <div class="border-r border-slate-700 p-2 text-center cursor-pointer hover:bg-slate-700 transition bg-slate-800" onclick="selectDate('${date.toISOString()}')">
        <div class="text-slate-400 text-xs font-semibold">${dayName}</div>
        <div class="text-white font-bold">${dayNum}</div>
      </div>
    `;
  }
  html += "</div>";

  const startHour = 8;
  const endHour = 18;

  for (let hour = startHour; hour < endHour; hour++) {
    html +=
      '<div class="grid grid-cols-8 gap-0 border-b border-slate-700 min-h-24">';

    html += `
      <div class="border-r border-slate-700 p-2 bg-slate-800 text-slate-400 text-xs font-semibold text-right pr-2 sticky left-0 z-5">
        ${hour}:00
      </div>
    `;

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      html += `
        <div 
          class="border-r border-slate-700 bg-slate-800 hover:bg-slate-700 transition cursor-pointer relative p-1" 
          onclick="selectDate('${date.toISOString()}')"
          id="slot-${dateStr}-${hour}">
        </div>
      `;
    }

    html += "</div>";
  }

  html += "</div>";
  grid.innerHTML = html;
  renderEventsOnGrid();
}

async function loadCalendar() {
  const loading = document.getElementById("loading");
  const calendarContainer = document.getElementById("calendar-container");
  const noEventsMessage = document.getElementById("no-events");

  try {
    loading.classList.remove("hidden");
    calendarContainer.classList.add("hidden");
    noEventsMessage.classList.add("hidden");

    const response = await fetch("http://localhost:3000/api/events");
    allEvents = await response.json();

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    const weekEvents = allEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= currentWeekStart && eventDate <= weekEnd;
    });

    loading.classList.add("hidden");

    calendarContainer.classList.remove("hidden");
    noEventsMessage.classList.add("hidden");
    createCalendarGrid();

    selectDate(selectedDate);
  } catch (error) {
    console.error("Erreur:", error);
    loading.classList.add("hidden");
    noEventsMessage.classList.remove("hidden");
    noEventsMessage.innerHTML =
      '<p class="text-red-500 text-xl">Erreur lors du chargement du calendrier</p>';
  }
}

document.getElementById("prev-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  loadCalendar();
});

document.getElementById("next-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  loadCalendar();
});

document.getElementById("today-btn").addEventListener("click", () => {
  currentWeekStart = getMonday(new Date());
  selectedDate = new Date();
  loadCalendar();
});

document.getElementById("close-panel").addEventListener("click", () => {
  const panel = document.querySelector(".w-full.lg\\:w-80");
  if (panel) {
    panel.classList.toggle("hidden");
  }
});

document.getElementById("add-event-day").addEventListener("click", () => {
  window.location.href = `add-event.html?date=${selectedDate.toISOString().split("T")[0]}`;
});
loadCalendar();
