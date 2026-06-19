(function () {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  const authLinks = document.getElementById("authLinks");
  const userInfo = document.getElementById("userInfo");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("antraUser"));
  } catch {
    user = null;
  }

  if (user) {
    if (authLinks) authLinks.style.display = "none";

    if (userInfo) {
      userInfo.style.display = "block";
      userInfo.innerHTML = `Logged in as <strong>${user.name || user.email}</strong>`;
    }

    const nameInput = document.getElementById("name");
    if (nameInput && user.name) {
      nameInput.value = user.name;
    }
  }

  const statusEl = document.getElementById("bookingStatus");
  const token = localStorage.getItem("antraToken");
  const API_URL = window.location.origin;
  const query = new URLSearchParams(window.location.search);

  const summary = {
    theater: query.get("theater") || "unknown",
    seats: (query.get("seats") || "")
      .split(",")
      .map(seat => seat.trim())
      .filter(Boolean),
    pricePerSeat: Number(query.get("pricePerSeat") || 0),
    count: Number(query.get("count") || 0),
    total: Number(query.get("total") || 0)
  };

  document.getElementById("summaryTheater").textContent = summary.theater;
  document.getElementById("summarySeats").textContent =
    summary.seats.length ? summary.seats.join(", ") : "None selected";
  document.getElementById("summaryPrice").textContent =
    `₹${summary.pricePerSeat}`;
  document.getElementById("summaryTotal").textContent =
    `₹${summary.total}`;

  document.getElementById("selectedSeats").value =
    summary.seats.join(", ");

  document.getElementById("bookingTotal").value =
    String(summary.total);

  document.getElementById("bookingTheater").value =
    summary.theater;

  if (!token) {
    statusEl.innerHTML =
      'Please <a href="login.html">log in</a> before uploading payment.';

    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name =
      document.getElementById("name").value.trim();

    const contactNumber =
      document.getElementById("contactNumber").value.trim();

    const screenshot =
      document.getElementById("image").files[0];

    if (!name || !contactNumber || !screenshot) {
      statusEl.textContent =
        "Fill in your name, contact number, and payment screenshot.";
      return;
    }

    if (!summary.seats.length) {
      statusEl.textContent = "No seats were selected.";
      return;
    }

    const payload = new FormData();

    payload.append("name", name);
    payload.append("contactNumber", contactNumber);
    payload.append("theater", summary.theater);
    payload.append("selectedSeats", summary.seats.join(", "));
    payload.append("ticketTotal", String(summary.total));
    payload.append("image", screenshot);

    statusEl.textContent = "Submitting payment...";

    try {
      const response = await fetch(
        `${API_URL}/api/book-ticket`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: payload
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not submit the booking."
        );
      }

      statusEl.textContent =
        "Payment uploaded successfully.";

      form.reset();

    } catch (error) {
      statusEl.textContent = error.message;
    }
  });
})();