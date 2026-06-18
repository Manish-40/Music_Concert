(function () {
  const form = document.getElementById("authForm");

  if (!form) return;

  const mode = form.dataset.mode;
  const statusEl = document.getElementById("authStatus");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value;

    let payload = {};

    if (mode === "register") {
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
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
    } else {
      const email = document.getElementById("email").value.trim();

      payload = {
        email,
        password,
      };
    }
    const API_URL = "https://music-concert.onrender.com";

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

      localStorage.setItem("antraToken", data.token);

      if (mode === "register") {

        localStorage.setItem(
          "antraUser",
          JSON.stringify({
            name: payload.name,
            email: payload.email,
          })
        );

        statusEl.textContent = "Registration successful";

      } else {

        localStorage.setItem(
          "antraUser",
          JSON.stringify({
            name: data.user.name,
            email: data.user.email,
          })
        );

        statusEl.textContent = "Login successful";
      }

      console.log(
        "Stored Token:",
        localStorage.getItem("antraToken")
      );

      console.log(
        "Stored User:",
        localStorage.getItem("antraUser")
      );

      // Wait 5 seconds before redirect
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);

    } catch (error) {
      statusEl.textContent = error.message;
    }
  });
})();