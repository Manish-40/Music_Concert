require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
const multer = require("multer");
const path = require("path");
const userAuth = require("./middleware/userAuth");
const port = process.env.PORT || 5001;





app.use(express.static(__dirname));

app.get("/mini", (req, res) => {
  res.sendFile(path.join(__dirname, "mini_theater.html"));
});

app.get("/big", (req, res) => {
  res.sendFile(path.join(__dirname, "big_theater.html"));
});

app.get("/mini_theater", (req, res) => {
  res.sendFile(path.join(__dirname, "mini_theater.html"));
});

app.get("/big_theater", (req, res) => {
  res.sendFile(path.join(__dirname, "big_theater.html"));
});

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing in .env file");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


app.get("/", (req, res) => {
  res.send("Server is running");
});
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
      {
        id: user.id,
        email: user.email,
        name: user.name
      },
      "antra_secret_key",
      {
        expiresIn: "7d"
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Registration failed"
    });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users1 WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email"
      });
    }

    const user = result.rows[0];

    if (user.password_hash !== password) {
      return res.status(401).json({
        error: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name
      },
      "antra_secret_key",
      {
        expiresIn: "7d"
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Login failed"
    });
  }
});

// =======================
// MULTER
// =======================

const fs = require("fs");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  }
});

const upload = multer({ storage });

// const upload = multer({ storage });
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
      `
      SELECT seat_number
      FROM bookings
      WHERE theater=$1
      `,
      [theater]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Could not load seats"
    });
  }
});

app.post("/api/feedback", userAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const name = req.user.name;
    const user_email = req.user.email;
    await pool.query(`INSERT INTO feedback(name,user_email,rating,comment) VALUES($1,$2,$3,$4)`, [name, user_email, rating, comment]);
    res.json({
      success: true,
      message: "Feedback submitted successfully"
    });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to submit feedback"
    });
  }
});

app.delete("/api/admin/delete-show/:id", async (req, res) => {

  const { id } = req.params;

  try {

    const showResult = await pool.query(
      "SELECT theater FROM shows WHERE id = $1",
      [id]
    );

    if (showResult.rows.length === 0) {
      return res.status(404).json({
        error: "Show not found"
      });
    }

    const showTheater = showResult.rows[0].theater;

    let bookingTheater = showTheater;

    if (showTheater === "big") {
      bookingTheater = "big_theater.html";
    } else if (showTheater === "mini") {
      bookingTheater = "mini_theater.html";
    }

    const bookingDeleteResult = await pool.query(
      "DELETE FROM bookings WHERE theater = $1",
      [bookingTheater]
    );

    await pool.query(
      "DELETE FROM shows WHERE id = $1",
      [id]
    );

    res.json({
      success: true,
      deletedBookings: bookingDeleteResult.rowCount,
      message: "Show and booked seats deleted successfully"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to delete show"
    });
  }
});

app.post("/api/admin/add-show", async (req, res) => {

  const { city, time, price, theater } = req.body;

  const galleryImages = [
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80"
  ];

  const randomImage =
    galleryImages[Math.floor(Math.random() * galleryImages.length)];

  try {

    const result = await pool.query(
      `
      INSERT INTO shows
      (city, price, rating, img, theater, show_time)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        city,
        price,
        4.0, // default rating
        randomImage,
        theater,
        time
      ]
    );

    res.json({
      message: "Show Added",
      show: result.rows[0]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to add show"
    });
  }
});

app.get("/api/shows", async (req, res) => {
  try {

    const result = await pool.query(
      "SELECT * FROM shows ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to load shows"
    });
  }
});
async function initDb() {
  try {
    // Test connection
    const result = await pool.query("SELECT NOW()");
    console.log("Database Connected:", result.rows[0]);

    // Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users1 (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log("Users table checked/created");
    await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    theater TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    total_price INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    screenshot_url TEXT,
    booking_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
)
`);
    console.log("Bookings table checked/created");

    await pool.query(`CREATE TABLE IF NOT EXISTS feedback(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
      )`)

    await pool.query(`
CREATE TABLE IF NOT EXISTS shows (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    rating DECIMAL(2,1) DEFAULT 4.0,
    img TEXT,
    theater VARCHAR(100) DEFAULT 'big',
    show_time VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`);
  } catch (error) {
    console.error("Database Error:");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    throw error;
  }
}

async function startServer() {
  try {
    console.log("Starting server...");

    await initDb();

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start application");
    process.exit(1);
  }
}

startServer();