import io from "socket.io-client"

const socket = io("http://localhost:5000", {
  transports: ["websocket"],    
});



socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit("hello", { msg: "world" });
});

socket.on("response", (data) => {
  console.log("Got response:", data);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
