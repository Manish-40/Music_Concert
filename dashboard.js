const API_URL = window.location.origin;

const user =
    JSON.parse(localStorage.getItem("antraUser"));

const token =
    localStorage.getItem("antraToken");

const statusEl =
    document.getElementById("status");

const adminName =
    document.getElementById("adminName");

const showsList =
    document.getElementById("showsList");

/* ===========================
   ADMIN CHECK
=========================== */

if (!user || user.role !== "admin") {

    alert("Access Denied");

    window.location.href = "index.html";
}

adminName.textContent =
    `Welcome Admin: ${user.name}`;


/* ===========================
   LOGOUT
=========================== */

document
    .getElementById("logoutBtn")
    .addEventListener("click", () => {

        localStorage.removeItem("antraUser");
        localStorage.removeItem("antraToken");

        window.location.href =
            "index.html";
    });


/* ===========================
   LOAD SHOWS
=========================== */

async function loadShows() {

    try {

        const res =
            await fetch(`${API_URL}/api/shows`);

        const shows =
            await res.json();

        showsList.innerHTML = "";

        shows.forEach(show => {

            showsList.innerHTML += `
<div class="show-item">

  <div class="show-info">

    <img
      src="${show.img}"
      class="show-img"
    >

    <div>

      <b>${show.city}</b><br>

      Time: ${show.show_time}<br>

      Price: ₹${show.price}<br>

      Theater:
      ${show.theater === "big"
                    ? "🎭 Big Theater"
                    : "🎭 Mini Theater"}

    </div>

  </div>

  <button
    class="danger"
    onclick="deleteShow(${show.id})"
  >
    Delete Show
  </button>

</div>
`;
        });

    } catch (err) {

        console.error(err);

        statusEl.textContent =
            "Failed to load shows";
    }
}


/* ===========================
   DELETE SHOW
=========================== */

async function deleteShow(id) {

    if (!confirm(
        "Delete this show?\n\nAll booked seats for this theater will also be deleted."
    )) {
        return;
    }

    try {

        const res = await fetch(
            `${API_URL}/api/admin/delete-show/${id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error);
        }

        statusEl.textContent =
            "Show and booked seats deleted successfully";

        loadShows();

    } catch (err) {

        console.error(err);

        statusEl.textContent =
            err.message;
    }
}

window.deleteShow = deleteShow;


/* ===========================
   ADD SHOW
=========================== */

document
    .getElementById("addShowBtn")
    .addEventListener("click", async () => {

        const city =
            document.getElementById("city").value;

        const time =
            document.getElementById("time").value;

        const price =
            document.getElementById("price").value;

        const theater =
            document.getElementById("theater").value;

        if (
            !city ||
            !time ||
            !price ||
            !theater
        ) {
            return alert("Fill all fields");
        }

        try {

            const res = await fetch(
                `${API_URL}/api/admin/add-show`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        city,
                        time,
                        price,
                        theater
                    })
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            statusEl.textContent =
                "Show added successfully";

            document.getElementById("city").value = "";
            document.getElementById("time").value = "";
            document.getElementById("price").value = "";

            const theaterEl = document.getElementById("theater");
            if (theaterEl) theaterEl.value = "";


            loadShows();

        } catch (err) {
            statusEl.textContent = err.message;
        }
    });


/* ===========================
   INITIAL LOAD
=========================== */

loadShows();