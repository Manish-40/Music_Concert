require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const userAuth = require("./middleware/userAuth");

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ✅ IMPORTANT: static hosting
app.use(express.static(__dirname));
app.use("/uploads", express.static("uploads"));

// ======================================================
// DATABASE
// ======================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ======================================================
// HOME
// ======================================================
app.get("/", (req, res) => {
  res.send("Server is running");
});

// ======================================================
// AUTH (same as yours)
// ======================================================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const result = await pool.query(
      `INSERT INTO users1(name,email,password_hash)
       VALUES($1,$2,$3)
       RETURNING *`,
      [name, email, password]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      "antra_secret_key",
      { expiresIn: "7d" }
    );

    res.json({ success: true, token, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ======================================================
// LOGIN
// ======================================================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users1 WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email" });
    }

    const user = result.rows[0];

    if (user.password_hash !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      "antra_secret_key",
      { expiresIn: "7d" }
    );

    res.json({ success: true, token, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ======================================================
// SERVE HTML FILES (ONLY THESE 2)
// ======================================================
app.get("/mini", (req, res) => {
  res.sendFile(path.join(__dirname, "mini_theater.html"));
});

app.get("/big", (req, res) => {
  res.sendFile(path.join(__dirname, "big_theater.html"));
});

// ======================================================
// BOOKED SEATS API
// ======================================================
// =======================
// MULTER SETUP
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// create uploads folder if not exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
app.post(
  "/api/book-ticket", userAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      const user_email = req.user.email;

      const {
        name,
        contactNumber,
        theater,
        selectedSeats,
        ticketTotal
      } = req.body;

      if (
        !name ||
        !contactNumber ||
        !theater ||
        !selectedSeats
      ) {
        return res.status(400).json({
          error: "Missing required fields"
        });
      }

      const seats = selectedSeats
        .split(",")
        .map((seat) => seat.trim());

      const screenshotUrl = req.file
        ? req.file.filename
        : null;

      for (const seat of seats) {

        const existing = await pool.query(
          `
          SELECT *
          FROM bookings
          WHERE theater=$1
          AND seat_number=$2
          `,
          [theater, seat]
        );

        if (existing.rows.length > 0) {
          return res.status(400).json({
            error: `Seat ${seat} already booked`
          });
        }

        await pool.query(
          `
          INSERT INTO bookings
          (
            user_email,
            theater,
            seat_number,
            total_price,
            customer_name,
            contact_number,
            screenshot_url
          )
          VALUES($1,$2,$3,$4,$5,$6,$7)
          `,
          [
            user_email,
            theater,
            seat,
            ticketTotal,
            name,
            contactNumber,
            screenshotUrl
          ]
        );
      }

      res.json({
        success: true,
        message: "Booking successful"
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: "Booking failed"
      });
    }
  }
);
app.get("/api/booked-seats/:theater", async (req, res) => {
  try {
    const { theater } = req.params;

    const result = await pool.query(
      "SELECT seat_number FROM bookings WHERE theater=$1",
      [theater]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load seats" });
  }
});

// ======================================================
// DELETE SHOW (FIXED)
// ======================================================
app.delete("/api/admin/delete-show/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const showResult = await pool.query(
      "SELECT theater FROM shows WHERE id=$1",
      [id]
    );

    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: "Show not found" });
    }

    const theater = showResult.rows[0].theater;

    // ✅ delete correct bookings
    await pool.query(
      "DELETE FROM bookings WHERE theater=$1",
      [theater]
    );

    await pool.query(
      "DELETE FROM shows WHERE id=$1",
      [id]
    );

    res.json({
      success: true,
      message: "Show deleted"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ======================================================
// ADD SHOW
// ======================================================
app.post("/api/admin/add-show", async (req, res) => {
  try {
    const { city, time, price, theater } = req.body;

    const images = [
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600",
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600"
    ];

    const img = images[Math.floor(Math.random() * images.length)];

    const result = await pool.query(
      `INSERT INTO shows(city,price,rating,img,theater,show_time)
       VALUES($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [city, price, 4.0, img, theater, time]
    );

    res.json({ success: true, show: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Add show failed" });
  }
});

// ======================================================
// GET SHOWS
// ======================================================
app.get("/api/shows", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM shows ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load shows" });
  }
});

// ======================================================
// START SERVER
// ======================================================
app.listen(port, async () => {
  console.log("Server running on port", port);
});
