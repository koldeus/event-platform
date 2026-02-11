async function loadEventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  const loading = document.getElementById("loading");
  const eventContent = document.getElementById("event-content");
  const errorMessage = document.getElementById("error-message");

  if (!eventId) {
    if (loading) loading.classList.add("hidden");
    if (errorMessage) errorMessage.classList.remove("hidden");
    return;
  }

  try {
    const response = await fetch(`/api/events/${eventId}`);

    if (!response.ok) {
      throw new Error("Événement non trouvé");
    }

    const event = await response.json();

    if (loading) loading.classList.add("hidden");
    if (errorMessage) errorMessage.classList.add("hidden");
    if (eventContent) eventContent.classList.remove("hidden");

    // Mise à jour des informations de l'événement avec vérification
    const eventTitle = document.getElementById("event-title");
    if (eventTitle) eventTitle.textContent = event.title;

    const eventDescription = document.getElementById("event-description");
    if (eventDescription) eventDescription.textContent = event.description;

    const eventDate = new Date(event.date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const eventDateEl = document.getElementById("event-date");
    if (eventDateEl) eventDateEl.textContent = eventDate;

    const eventLocation = document.getElementById("event-location");
    if (eventLocation) eventLocation.textContent = event.location;

    const eventVotes = document.getElementById("event-votes");
    if (eventVotes) {
      const votesCount = Array.isArray(event.votes) ? event.votes.length : 0;
      eventVotes.textContent = votesCount;
    }

    const registrationCount = document.getElementById("registration-count");
    if (registrationCount) {
      const regCount = Array.isArray(event.registrations)
        ? event.registrations.length
        : 0;
      registrationCount.textContent = regCount;
    }

    const registrationsList = document.getElementById("registrations-list");
    if (
      registrationsList &&
      event.registrations &&
      event.registrations.length > 0
    ) {
      registrationsList.innerHTML = event.registrations
        .map(
          (r) => `<div class="text-slate-300 text-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            ${r.name || r.email || "Utilisateur"}
        </div>`,
        )
        .join("");
    } else if (registrationsList) {
      registrationsList.innerHTML =
        '<p class="text-slate-400 text-sm">Aucune inscription pour le moment</p>';
    }

    const currentUser = getCurrentUser();
    const voteBtn = document.getElementById("vote-btn");
    const registerBtn = document.getElementById("register-btn");
    const voteError = document.getElementById("vote-error");
    const registerError = document.getElementById("register-error");

    if (!currentUser) {
      if (voteBtn) {
        voteBtn.disabled = true;
        voteBtn.innerHTML =
          '<svg class="inline w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v-6a1.5 1.5 0 11-3 0v6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg> Connectez-vous pour voter';
      }
      if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.innerHTML =
          '<i class="bi bi-pencil"></i> Connectez-vous pour vous inscrire';
      }
    } else {
      // Gérer le vote
      if (voteBtn) {
        const hasVoted =
          Array.isArray(event.votes) &&
          event.votes.some((v) => v.userId === currentUser.id);
        if (hasVoted) {
          voteBtn.disabled = true;
          voteBtn.classList.add("bg-green-600", "hover:bg-green-700");
          voteBtn.classList.remove(
            "bg-slate-700",
            "hover:bg-slate-600",
            "bg-indigo-600",
            "hover:bg-indigo-700",
          );
          voteBtn.innerHTML =
            '<i class="bi bi-check-lg"></i> Merci pour votre vote!';
        } else {
          voteBtn.addEventListener("click", async () => {
            try {
              if (voteError) voteError.classList.add("hidden");
              const voteResponse = await fetch(`/api/events/${eventId}/vote`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: currentUser.id,
                }),
              });

              if (!voteResponse.ok) {
                const error = await voteResponse.json();
                throw new Error(error.error || "Erreur lors du vote");
              }

              const updatedEvent = await voteResponse.json();
              const eventVotesEl = document.getElementById("event-votes");
              if (eventVotesEl) {
                const votesCount = Array.isArray(updatedEvent.votes)
                  ? updatedEvent.votes.length
                  : 0;
                eventVotesEl.textContent = votesCount;
              }

              voteBtn.disabled = true;
              voteBtn.classList.add("bg-green-600", "hover:bg-green-700");
              voteBtn.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
              voteBtn.innerHTML =
                '<i class="bi bi-check-lg"></i> Merci pour votre vote!';
            } catch (error) {
              console.error("Erreur:", error);
              if (voteError) {
                voteError.textContent = error.message;
                voteError.classList.remove("hidden");
              }
            }
          });
        }
      }

      // Gérer l'inscription
      if (registerBtn) {
        const isRegistered =
          Array.isArray(event.registrations) &&
          event.registrations.some((r) => r.userId === currentUser.id);

        if (isRegistered) {
          registerBtn.classList.add("bg-red-600", "hover:bg-red-700");
          registerBtn.classList.remove(
            "bg-slate-700",
            "hover:bg-slate-600",
            "bg-green-600",
            "hover:bg-green-700",
          );
          registerBtn.innerHTML = '<i class="bi bi-x-lg"></i> Se désinscrire';

          const newRegisterBtn = registerBtn.cloneNode(true);
          registerBtn.parentNode.replaceChild(newRegisterBtn, registerBtn);
          newRegisterBtn.addEventListener("click", async () => {
            try {
              if (registerError) registerError.classList.add("hidden");
              const response = await fetch(
                `/api/events/${eventId}/unregister`,
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

              if (!response.ok) {
                const error = await response.json();
                throw new Error(
                  error.error || "Erreur lors de la désinscription",
                );
              }

              // Recharger les détails de l'événement
              loadEventDetails();
            } catch (error) {
              console.error("Erreur:", error);
              if (registerError) {
                registerError.textContent = error.message;
                registerError.classList.remove("hidden");
              }
            }
          });
        } else {
          registerBtn.classList.add("bg-green-600", "hover:bg-green-700");
          registerBtn.classList.remove(
            "bg-red-600",
            "hover:bg-red-700",
            "bg-slate-700",
            "hover:bg-slate-600",
          );
          registerBtn.innerHTML = '<i class="bi bi-pencil"></i> S\'inscrire';

          registerBtn.addEventListener("click", async () => {
            try {
              if (registerError) registerError.classList.add("hidden");
              const response = await fetch(`/api/events/${eventId}/register`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: currentUser.id,
                  name: currentUser.name,
                  email: currentUser.email,
                }),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erreur lors de l'inscription");
              }

              // Recharger les détails de l'événement
              loadEventDetails();
            } catch (error) {
              console.error("Erreur:", error);
              if (registerError) {
                registerError.textContent = error.message;
                registerError.classList.remove("hidden");
              }
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("Erreur:", error);
    if (loading) loading.classList.add("hidden");
    if (eventContent) eventContent.classList.add("hidden");
    if (errorMessage) {
      errorMessage.classList.remove("hidden");
      errorMessage.textContent =
        error.message || "Erreur lors du chargement de l'événement";
    }
  }
}

loadEventDetails();
