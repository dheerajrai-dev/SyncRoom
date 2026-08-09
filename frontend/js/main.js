const API_BASE_URL = "http://localhost:8000";

const createRoomButton = document.getElementById("create-room-button");
const roomResultDiv = document.getElementById("room-result");

createRoomButton.addEventListener("click", async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();

    sessionStorage.setItem("host_token", data.host_token);
    sessionStorage.setItem("room_code", data.code);

    roomResultDiv.innerHTML = `
      <p>Room created! Code: <strong>${data.code}</strong></p>
      <p>Save this host token somewhere safe — it will not be shown again:</p>
      <code>${data.host_token}</code>
    `;
  } catch (error) {
    roomResultDiv.innerHTML = `<p class="error">Something went wrong: ${error.message}</p>`;
  }
});

const checkRoomForm = document.getElementById("check-room-form");
const checkRoomResultDiv = document.getElementById("check-room-result");

checkRoomForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const roomCode = document.getElementById("room-code-input").value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}`);

    if (response.status === 404) {
      checkRoomResultDiv.innerHTML = `<p class="error">No room found with that code.</p>`;
      return;
    }

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    checkRoomResultDiv.innerHTML = `
      <p>Room found: <strong>${data.name ?? "(no name set)"}</strong></p>
      <p>Locked: ${data.locked ? "Yes" : "No"}</p>
    `;
  } catch (error) {
    checkRoomResultDiv.innerHTML = `<p class="error">Something went wrong: ${error.message}</p>`;
  }
});
