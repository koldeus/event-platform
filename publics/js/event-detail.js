async function loadEventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  const loading = document.getElementById("loading");
  const eventContent = document.getElementById("event-content");
  const errorMessage = document.getElementById("error-message");

  if (!eventId) {
    loading.classList.add("hidden");
    errorMessage.classList.remove("hidden");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/events/${eventId}`);

    if (!response.ok) {
      throw new Error("Événement non trouvé");
    }

    const event = await response.json();

    loading.classList.add("hidden");
    errorMessage.classList.add("hidden");
    eventContent.classList.remove("hidden");

    document.getElementById("event-title").textContent = event.title;
    document.getElementById("event-description").textContent =
      event.description;

    const eventDate = new Date(event.date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    document.getElementById("event-date").textContent = eventDate;
    document.getElementById("event-location").textContent = event.location;
    document.getElementById("event-votes").textContent = event.votes
      ? event.votes.length
      : 0;

    const registrationCount = document.getElementById("registration-count");
    registrationCount.textContent = event.registrations
      ? event.registrations.length
      : 0;

    const registrationsList = document.getElementById("registrations-list");
    if (event.registrations && event.registrations.length > 0) {
      registrationsList.innerHTML = event.registrations
        .map((r) => `<div class="text-slate-300 text-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            ${r.name}
        </div>`)
        .join("");
    }

    const currentUser = getCurrentUser();
    const voteBtn = document.getElementById("vote-btn");
    const registerBtn = document.getElementById("register-btn");
    const voteError = document.getElementById("vote-error");
    const registerError = document.getElementById("register-error");

    if (!currentUser) {
      voteBtn.disabled = true;
      voteBtn.innerHTML = '<svg class="inline w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v-6a1.5 1.5 0 11-3 0v6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg> Connectez-vous pour voter';
      registerBtn.disabled = true;
      registerBtn.innerHTML = '<i class="bi bi-pencil"></i> Connectez-vous pour vous inscrire';
    } else {
      const hasVoted =
        event.votes && event.votes.some((v) => v.userId === currentUser.id);
      if (hasVoted) {
        voteBtn.disabled = true;
        voteBtn.classList.add("bg-green-600", "hover:bg-green-700");
        voteBtn.classList.remove("bg-slate-700", "hover:bg-slate-600");
        voteBtn.innerHTML = '<i class="bi bi-check-lg"></i> Merci pour votre vote!';
      } else {
        voteBtn.addEventListener("click", async () => {
          try {
            voteError.classList.add("hidden");
            const voteResponse = await fetch(
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

            if (!voteResponse.ok) {
              const error = await voteResponse.json();
              throw new Error(error.error);
            }

            const updatedEvent = await voteResponse.json();
            document.getElementById("event-votes").textContent =
              updatedEvent.votes ? updatedEvent.votes.length : 0;
            voteBtn.disabled = true;
            voteBtn.classList.add("bg-green-600", "hover:bg-green-700");
            voteBtn.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
            voteBtn.innerHTML = '<i class="bi bi-check-lg"></i> Merci pour votre vote!';
          } catch (error) {
            console.error("Erreur:", error);
            voteError.textContent = error.message;
            voteError.classList.remove("hidden");
          }
        });
      }

      const isRegistered =
        event.registrations &&
        event.registrations.some((r) => r.userId === currentUser.id);
      if (isRegistered) {
        registerBtn.classList.add("bg-red-600", "hover:bg-red-700");
        registerBtn.classList.remove("bg-slate-700", "hover:bg-slate-600");
        registerBtn.innerHTML = '<i class="bi bi-check-lg"></i> Inscrit - Cliquez pour vous désinscrire';

        registerBtn.addEventListener("click", async () => {
          try {
            registerError.classList.add("hidden");
            const response = await fetch(
              `http://localhost:3000/api/events/${eventId}/register`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: currentUser.id,
                }),
              },
            );

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error);
            }

            const updatedEvent = await response.json();
            loadEventDetails(); 
          } catch (error) {
            console.error("Erreur:", error);
            registerError.textContent = error.message;
            registerError.classList.remove("hidden");
          }
        });
      } else {
        registerBtn.addEventListener("click", async () => {
          try {
            registerError.classList.add("hidden");
            const response = await fetch(
              `http://localhost:3000/api/events/${eventId}/register`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: currentUser.id,
                  name: currentUser.name,
                  email: currentUser.email,
                }),
              },
            );

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error);
            }

            const updatedEvent = await response.json();
            document.getElementById("registration-count").textContent =
              updatedEvent.registrations
                ? updatedEvent.registrations.length
                : 0;

            registerBtn.classList.add("bg-red-600", "hover:bg-red-700");
            registerBtn.classList.remove("bg-green-600", "hover:bg-green-700");
            registerBtn.innerHTML =
              '<i class="bi bi-check-lg"></i> Inscrit - Cliquez pour vous désinscrire';

            loadEventDetails();
          } catch (error) {
            console.error("Erreur:", error);
            registerError.textContent = error.message;
            registerError.classList.remove("hidden");
          }
        });
      }
    }
  } catch (error) {
    console.error("Erreur:", error);
    loading.classList.add("hidden");
    eventContent.classList.add("hidden");
    errorMessage.classList.remove("hidden");
    errorMessage.textContent =
      error.message || "Erreur lors du chargement de l'événement";
  }
}

loadEventDetails();
