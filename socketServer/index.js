import express from "express"
import http from "http"
import dotenv from "dotenv"
import { Server } from "socket.io"
import axios from "axios"
import cron from "node-cron"
dotenv.config()
const app = express()
app.use(express.json())

const server = http.createServer(app)
const port = process.env.PORT || 5000
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.NEXT_BASE_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

const io = new Server(server, {
  cors: {
    // Supports comma-separated origins for production + preview URLs.
    origin:
      allowedOrigins.length > 0
        ? allowedOrigins
        : ["http://localhost:3000"],
  },
})

io.on("connection", (socket) => {

  socket.on("identity", async (userId) => {
    await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/connect`, {userId, socketId: socket.id})
  });

  socket.on("update-location", async ({userId, latitude, longitude}) => {
    const location = {
        type: "Point",
        coordinates: [longitude, latitude]
    }
    await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/update-location`,
    {userId, location}
    )
    io.emit("update-deliveryBoy-location", { userId, location });
  })

  socket.on("join-room", (roomId) => {
    console.log("join room with", roomId)
    socket.join(roomId);
  })

  socket.on("send-message", async (message) => {
    console.log(message)
    await axios.post(`${process.env.NEXT_BASE_URL}/api/chat/save`, message)
    io.to(message.roomId).emit("send-message", message);
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.post("/notify", (req, res) => {
  const {event, data, socketId} = req.body
  if(socketId) {
    io.to(socketId).emit(event, data)
  }
  else {
    io.emit(event, data)
  }

  return res.status(200).json({"success": true})
})


server.listen(port, () => {
    console.log("server started at", port)
})

// ---- Repeat orders cron (minimal) ----
// Every 10 minutes: send reminders + place due COD orders.
// Requires Snapcart Next.js app running and reachable at NEXT_BASE_URL.
// Optionally secure with CRON_SECRET (will be forwarded as x-cron-secret).
const tickUrl = `${process.env.NEXT_BASE_URL}/api/internal/repeat-orders/tick`
if (process.env.NEXT_BASE_URL) {
  cron.schedule("*/10 * * * *", async () => {
    try {
      await axios.post(
        tickUrl,
        {},
        {
          headers: process.env.CRON_SECRET
            ? { "x-cron-secret": process.env.CRON_SECRET }
            : undefined,
        },
      )
    } catch (e) {
      // Best-effort: avoid crashing the socket server.
      console.log("repeat tick failed")
    }
  })
}