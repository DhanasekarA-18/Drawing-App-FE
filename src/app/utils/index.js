// import { io } from "socket.io-client";

// const socket = io("http://localhost:5001", {
//   reconnectionAttempts: 5,
//   //   timeout: 5000,
// });

// export default socket;

import { io } from "socket.io-client";

const socket = io("http://localhost:5001"); // Change this to your WebSocket server URL

export default socket;
