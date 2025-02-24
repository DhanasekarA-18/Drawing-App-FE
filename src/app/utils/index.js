import { io } from "socket.io-client";
import getUserId from "./helper";

let userId = await getUserId();

const socketOptions = {
  query: { userId },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
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

if (!window.activeSocket) {
  window.activeSocket = socket;
}

export default socket;
