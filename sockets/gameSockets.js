// sockets/gameSockets.js
const initGameSockets = (io) => {
  const gameio = io.of("/api/game") 
  gameio.on("connection", (socket) => {
    console.log(`⚡ New client connected: ${socket.id}`);

    // Join a specific game's room
    socket.on("joinGame", (gameId) => {
      socket.join(gameId);
      console.log(`Socket ${socket.id} joined room ${gameId}`);
    });

    // Allow admins/coaches to push live updates
    socket.on("updateGame", (updateData) => {
      if (socket.user?.role === "admin" || socket.user?.role === "coach") {

        io.to(updateData.gameId).emit("gameUpdated", updateData);
        console.log(`Broadcasted update to game ${updateData.gameId}`);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

export default initGameSockets;
