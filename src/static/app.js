document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeoutId;

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    if (messageTimeoutId) {
      clearTimeout(messageTimeoutId);
    }

    // Hide message after 5 seconds
    messageTimeoutId = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participants = details.participants || [];
        const participantItems = participants.length
          ? participants
              .map((participant) => {
                const encodedActivity = encodeURIComponent(name);
                const encodedEmail = encodeURIComponent(participant);
                return `
                  <li class="participant-item">
                    <span class="participant-email">${escapeHtml(participant)}</span>
                    <button
                      type="button"
                      class="delete-participant-btn"
                      data-activity="${encodedActivity}"
                      data-email="${encodedEmail}"
                      aria-label="Remove ${escapeHtml(participant)} from ${escapeHtml(name)}"
                      title="Unregister participant"
                    >
                      &times;
                    </button>
                  </li>
                `;
              })
              .join("")
          : '<li class="participant-empty">No participants signed up yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title"><strong>Participants</strong></p>
            <ul class="participants-list">
              ${participantItems}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupForm.reset();
      }

      showMessage(response.ok ? result.message : result.detail || "An error occurred", response.ok ? "success" : "error");

      if (response.ok) {
        await fetchActivities();
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".delete-participant-btn");
    if (!removeButton) {
      return;
    }

    const encodedActivity = removeButton.dataset.activity;
    const encodedEmail = removeButton.dataset.email;

    if (!encodedActivity || !encodedEmail) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodedActivity}/participants/${encodedEmail}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      showMessage(response.ok ? result.message : result.detail || "Unable to unregister participant", response.ok ? "success" : "error");

      if (response.ok) {
        await fetchActivities();
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
