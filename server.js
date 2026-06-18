require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
const port = process.env.PORT || 5001;
const multer = require("multer");
const path = require("path");
const userAuth = require("./middleware/userAuth");

app.use(express.static(__dirname));

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

app.use(express.json());

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
app.post(
  "/api/book-ticket", userAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("REQ.USER =", req.user);
      const user_email = req.user.email;
      console.log(req.body);
      console.log(req.file);

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