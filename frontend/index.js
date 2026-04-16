const express = require("express");
const http = require("http"); // For wrapping express with Node's http.createServer() so that Socket.IO and Express share the same port.
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = http.createServer(app); // wrap express app for socket.io

//io is the Socket.IO server instance.
//listens for real-time WebSocket connections.
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with frontend origin if needed
    methods: ["GET", "POST"],
  },
});

const db = require("./config/dbconfig");
const PORT = process.env.SERVER_PORT || 5000;

app.use(express.json());
app.use(cors());

// 🔴 Global list of called numbers
// array tracks all balls drawn.
let GLOBAL_CALLED_NUMBERS = [];
let GLOBAL_PATTERN = "";
let GLOBAL_WINNER = null;

// ✅ WebSocket Broadcast for pattern
const broadcastPattern = () => {
  io.emit("update-pattern", GLOBAL_PATTERN); // 🔁 Broadcast pattern to all clients
};

// ✅ WebSocket Broadcast
//Sends the updated GLOBAL_CALLED_NUMBERS to all connected clients via Socket.IO event named update-called-numbers.
const broadcastCalledNumbers = () => {
  io.emit("update-called-numbers", GLOBAL_CALLED_NUMBERS);
};

// ✅ API: Get all called numbers
//Optional fallback (e.g. in case a client joins late or has sync issues).
app.get("/api/calledNumbers", (req, res) => {
  res.json({ calledNumbers: GLOBAL_CALLED_NUMBERS });
});

//Admin udpates the new pattern.
app.post("/api/setPattern", (req, res) => {
  const { pattern } = req.body;

  if (!pattern) {
    return res.status(400).json({ message: "Pattern is required" });
  }

  GLOBAL_PATTERN = pattern;
  broadcastPattern(); // 🔊 send it to all players

  res.json({ success: true });
});

// ✅ API: Admin adds new number
//Admin POSTs a new ball.
app.post("/api/calledNumbers", (req, res) => {
  const { ball } = req.body;

  if (GLOBAL_WINNER) {
    return res
      .status(403)
      .json({ message: "A winner has already been declared." });
  }

  //It's stored in GLOBAL_CALLED_NUMBERS.
  if (!ball || GLOBAL_CALLED_NUMBERS.includes(ball)) {
    return res.status(400).json({ message: "Invalid or duplicate ball." });
  }

  GLOBAL_CALLED_NUMBERS.push(ball);
  broadcastCalledNumbers(); // 📡 Broadcast update to all clients via WebSocket

  res.json({ success: true });
});

app.get("/api/getWinner", (req, res) => {
  res.json({ winnerId: GLOBAL_WINNER });
});

app.post("/api/setWinner", async (req, res) => {
  const { winnerId, pattern } = req.body;

  if (GLOBAL_WINNER) {
    return res.status(409).json({ message: "Winner already declared." });
  }

  if (!winnerId || !pattern) {
    return res.status(400).json({ message: "Missing winnerId or pattern." });
  }

  try {
    const query = `
      INSERT INTO 9999_cmx_appdata_tempdata.bingo_winners (employee_id, pattern)
      VALUES (?, ?)
    `;
    await db.execute(query, [winnerId, pattern]);

    GLOBAL_WINNER = winnerId;
    io.emit("game-winner", winnerId);
    console.log(`🎉 Winner is: ${winnerId}, Pattern: ${pattern}`);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to save winner to DB:", err);
    res.status(500).json({ message: "Database error." });
  }
});

// Check if an employee has already won
// ✅ Check if the employee has already won
app.get("/api/hasWon/:employeeId", async (req, res) => {
  const { employeeId } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT * FROM 9999_cmx_appdata_tempdata.bingo_winners WHERE employee_id = ? LIMIT 1",
      [employeeId],
    );

    if (rows.length > 0) {
      return res.json({ hasWon: true });
    } else {
      return res.json({ hasWon: false });
    }
  } catch (err) {
    console.error("Error checking winner status:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ API: Reset game (called numbers and pattern)
app.post("/api/resetGame", async (req, res) => {
  GLOBAL_CALLED_NUMBERS = [];
  GLOBAL_PATTERN = "";
  GLOBAL_WINNER = null; // 👈 reset winner in memory

  try {
    // 🔥 Clear winner from DB
    await db.query("DELETE FROM 9999_cmx_appdata_tempdata.bingo_winners");

    // 🔊 Notify all clients about the reset
    io.emit("update-called-numbers", GLOBAL_CALLED_NUMBERS);
    io.emit("update-pattern", GLOBAL_PATTERN);
    io.emit("game-winner", null); // broadcast winner reset too

    console.log("🔁 Game reset by admin + DB winner cleared.");
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to reset game:", err);
    res.status(500).json({ message: "Failed to reset game." });
  }
});

// 🔌 WebSocket connection
io.on("connection", (socket) => {
  console.log("🧠 Client connected via WebSocket");

  // 🔁 send current pattern to new client
  socket.emit("update-pattern", GLOBAL_PATTERN);

  //Send current numbers immediately to new client
  socket.emit("update-called-numbers", GLOBAL_CALLED_NUMBERS);

  // ✅ ALSO send the current winner, if any
  if (GLOBAL_WINNER) {
    socket.emit("game-winner", GLOBAL_WINNER);
  }

  socket.on("disconnect", () => {
    console.log("👋 Client disconnected");
  });
});

// ✅ API: Email validation
app.get("/api/validateEmail/:email", async (req, res) => {
  const email = req.params.email;
  console.log("🔍 Validating email:", email);

  const query = `
    SELECT EMPLOYEEID, FULLNAME, DEPARTMENT, EMPLOYEESTATUS, EMAIL
    FROM z_webapp_central_auth.db_ph_employee_lookup
    WHERE EMPLOYEEID = ?
      AND EMPLOYEESTATUS NOT IN ('Resigned', 'Terminated', 'End of Contract')
  `;

  try {
    const [rows] = await db.execute(query, [email]);
    console.log("✅ Query result:", rows);

    if (rows.length > 0) {
      res.json({ exists: true, employee: rows[0] });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error("❌ Email lookup failed:", error);
    res.status(500).json({ exists: false });
  }
});

// ✅ API: Check if game has started
app.get("/api/gameStarted", (req, res) => {
  const hasStarted = GLOBAL_CALLED_NUMBERS.length > 0;
  res.json({ hasStarted });
});

// 🚀 Start server
server.listen(PORT, () => {
  console.log(`🚀 Server + WebSocket running on port ${PORT}`);
});

//7001703
//7000090
