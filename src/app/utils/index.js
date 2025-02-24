import { io } from "socket.io-client";
import getUserId from "./helper";

let userId = await getUserId();

const socketOptions = {
  query: { userId },
  transports: ["polling", "websocket"], // Prioritize polling
  reconnection: true,
  reconnectionAttempts: 10, // Try 10 times before failing
  reconnectionDelay: 2000, // Wait 2s before retrying
  reconnectionDelayMax: 10000, // Max delay of 10s
  randomizationFactor: 0.7,
};

const socket = io(process.env.SOCKET_URL, socketOptions);

socket.on("reconnect_attempt", (attempt) => {
  console.warn(`🔄 Attempting to reconnect... (${attempt}/5)`);
});

socket.on("reconnect", (attempt) => {
  console.log(`✅ Reconnected successfully after ${attempt} attempts`);
  socket.emit("user-reconnected", { userId });
});

socket.on("reconnect_failed", () => {
  console.error("❌ Failed to reconnect. Giving up.");
});

// Handle disconnect event
socket.on("disconnect", (reason) => {
  console.warn(`⚠️ Disconnected: ${reason}`);
  if (reason === "io server disconnect") {
    socket.connect(); // Manually reconnect if server disconnects
  }
});

if (typeof window !== "undefined") {
  if (!window.activeSocket) {
    window.activeSocket = socket;
  }
}

export default socket;
