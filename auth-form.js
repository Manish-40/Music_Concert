(function () {
  const form = document.getElementById("authForm");
  if (!form) return;

  const mode = form.dataset.mode;
  const statusEl = document.getElementById("authStatus");

  const API_URL = window.__APP_BASE_URL__ || window.location.origin;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    let payload = {};

    /* =========================================================
       REGISTER MODE
    ========================================================= */
    if (mode === "register") {
      const name = document.getElementById("name").value.trim();
      const confirmPassword =
        document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        statusEl.textContent = "Passwords do not match";
        return;
      }

      payload = {
        name,
        email,
        password,
      };
    }

    /* =========================================================
       LOGIN MODE
    ========================================================= */
    else {
      payload = {
        email,
        password,
      };
    }

    const endpoint =
      mode === "register"
        ? `${API_URL}/api/register`
        : `${API_URL}/api/login`;

    try {
      statusEl.textContent = "Please wait...";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      console.log("API Response:", data);

      /* =========================================================
         ADMIN CHECK (FRONTEND ROLE SYSTEM)
      ========================================================= */
      const isAdmin =
        email === "admin@gmail.com" &&
        password === "Admin@12345";

      const userData = {
        name: isAdmin
          ? "Admin"
          : mode === "register"
            ? payload.name
            : data.user?.name,

        email: email,

        role: isAdmin ? "admin" : "user",
      };

      /* =========================================================
         STORE SESSION
      ========================================================= */
      localStorage.setItem("antraToken", data.token);
      localStorage.setItem("antraUser", JSON.stringify(userData));

      console.log("Stored Token:", localStorage.getItem("antraToken"));
      console.log("Stored User:", localStorage.getItem("antraUser"));

      /* =========================================================
         STATUS MESSAGE
      ========================================================= */
      statusEl.textContent =
        mode === "register"
          ? "Registration successful"
          : "Login successful";

      /* =========================================================
         REDIRECT LOGIC
      ========================================================= */
      setTimeout(() => {

        // Admin also goes to homepage first
        window.location.href = "index.html";

      }, 1000);

    } catch (error) {
      statusEl.textContent = error.message;
    }
  });
})();