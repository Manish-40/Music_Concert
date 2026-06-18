// =========================================================
// CONFIG
// =========================================================

const PRICE_PER_SEAT = Number(window.SEAT_PRICE ?? 299);
const THEATER_KEY = window.THEATER_KEY || "";

const bookedSeatIds = new Set();
const selectedSeats = new Set();

// =========================================================
// ROW LETTERS
// =========================================================

function rowLetter(index) {
  let s = "";
  index += 1;

  while (index > 0) {
    const rem = (index - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    index = Math.floor((index - 1) / 26);
  }

  return s;
}

// =========================================================
// BUILD BLOCK
// =========================================================

function buildBlock(block, container) {
  const blockEl = document.createElement("div");
  blockEl.className = "block";

  if (block.label) {
    const labelEl = document.createElement("div");
    labelEl.className = "block-label";
    labelEl.textContent = block.label;
    blockEl.appendChild(labelEl);
  }

  const rowsEl = document.createElement("div");
  rowsEl.className = "rows";

  let globalRowIndex = 0;

  block.rowGroups.forEach((group) => {

    if (group.gapAfter === "before") {
      const gap = document.createElement("div");
      gap.className = "row-gap";
      rowsEl.appendChild(gap);
    }

    group.columns.forEach((seatCount) => {

      const rowEl = document.createElement("div");
      rowEl.className = "row";

      const letter = rowLetter(globalRowIndex);

      for (let seatNo = 1; seatNo <= seatCount; seatNo++) {

        const seatId = `${letter}${seatNo}`;

        const seat = document.createElement("div");
        seat.className = "seat";
        seat.textContent = seatNo;

        seat.dataset.seatId = seatId;
        seat.setAttribute("data-seat", seatId);
        seat.dataset.block = block.label;

        rowEl.appendChild(seat);
      }

      rowsEl.appendChild(rowEl);
      globalRowIndex++;
    });

    if (group.gapAfter === true) {
      const gap = document.createElement("div");
      gap.className = "row-gap";
      rowsEl.appendChild(gap);
    }
  });

  blockEl.appendChild(rowsEl);
  container.appendChild(blockEl);
}

// =========================================================
// RENDER MAP
// =========================================================

function renderSeatMap(blocks, containerId) {

  const container = document.getElementById(containerId);

  container.innerHTML = "";

  blocks.forEach((block) => {
    buildBlock(block, container);
  });

  syncBookedSeatsFromServer();
}

// =========================================================
// BOOKED SEATS
// =========================================================

function applyBookedSeats(seats) {

  bookedSeatIds.clear();

  seats.forEach((seat) => {
    bookedSeatIds.add(seat);
  });

  document.querySelectorAll(".seat").forEach((seat) => {

    const seatId =
      seat.dataset.seatId +
      "-" +
      seat.dataset.block;

    if (bookedSeatIds.has(seatId)) {

      seat.classList.add("booked");
      seat.classList.remove("selected");

      selectedSeats.delete(seatId);
    }
  });

  updateBookingBar();
}

// =========================================================
// LOAD BOOKED SEATS
// =========================================================

async function syncBookedSeatsFromServer() {

  if (!THEATER_KEY) return;

  try {

    const response = await fetch(
      `http://localhost:5001/api/booked-seats/${THEATER_KEY}`
    );

    if (!response.ok) return;

    const data = await response.json();

    applyBookedSeats(
      data.map((row) => row.seat_number)
    );

  } catch (err) {

    console.error(
      "Failed to load booked seats:",
      err
    );
  }
}

// =========================================================
// BOOKING BAR
// =========================================================

function updateBookingBar() {

  const countEl =
    document.getElementById("bookingCount");

  const seatsEl =
    document.getElementById("bookingSeats");

  const totalEl =
    document.getElementById("bookingTotal");

  const bookBtn =
    document.getElementById("bookBtn");

  const count = selectedSeats.size;

  countEl.textContent =
    count === 0
      ? "No seats selected"
      : `${count} seat${count > 1 ? "s" : ""} selected`;

  seatsEl.textContent =
    count === 0
      ? ""
      : Array.from(selectedSeats).join(", ");

  totalEl.textContent =
    `₹${count * PRICE_PER_SEAT}`;

  bookBtn.disabled = count === 0;
}

// =========================================================
// SEAT CLICK
// =========================================================

function initSeatSelection(containerId) {

  const container =
    document.getElementById(containerId);

  container.addEventListener("click", (e) => {

    const seat =
      e.target.closest(".seat");

    if (!seat) return;

    if (seat.classList.contains("booked")) {
      return;
    }

    const seatId =
      seat.dataset.seatId +
      "-" +
      seat.dataset.block;

    if (seat.classList.contains("selected")) {

      seat.classList.remove("selected");

      selectedSeats.delete(seatId);

    } else {

      seat.classList.add("selected");

      selectedSeats.add(seatId);
    }

    updateBookingBar();
  });
}

// =========================================================
// BOOK BUTTON
// =========================================================

document
  .getElementById("bookBtn")
  ?.addEventListener("click", () => {
    console.log("THEATER:", THEATER_KEY);
    if (selectedSeats.size === 0) return;

    const booking = {

      theater: THEATER_KEY,

      seats: Array.from(selectedSeats),

      seatCount: selectedSeats.size,

      pricePerSeat: PRICE_PER_SEAT,

      total:
        selectedSeats.size *
        PRICE_PER_SEAT
    };

    sessionStorage.setItem(
      "antraBookingSummary",
      JSON.stringify(booking)
    );

    const params =
      new URLSearchParams({

        theater:
          booking.theater,

        seats:
          booking.seats.join(","),

        count:
          booking.seatCount,

        total:
          booking.total,

        pricePerSeat:
          booking.pricePerSeat
      });

    window.location.href =
      `http://localhost:5001/pay_inp.html?${params.toString()}`;
  });

// =========================================================
// INITIAL STATE
// =========================================================

updateBookingBar();