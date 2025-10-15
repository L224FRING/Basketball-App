import Game from '../models/Game.js';

// sockets/gameSockets.js
const initGameSockets = (io) => {
  io.on("connection", (socket) => {
    console.log(`⚡ New client connected: ${socket.id}`);

    // Join a specific game's room
    socket.on("joinGame", (gameId) => {
      socket.join(gameId);
      console.log(`Socket ${socket.id} joined room ${gameId}`);
    });

    // Allow admins/coaches to push live updates
    socket.on("updateGame", async (data) => {
        try {
          const { gameId, homeScore, awayScore, status } = data;

          const updateFields = {};
          if (homeScore !== undefined) updateFields.homeScore = homeScore;
          if (awayScore !== undefined) updateFields.awayScore = awayScore;
          if (status !== undefined) updateFields.status = status;

          const game = await Game.findByIdAndUpdate(
            gameId,
            updateFields,
            { new: true, runValidators: true }
          )
            .populate("homeTeam", "name")
            .populate("awayTeam", "name");

          if (!game) {
            return socket.emit("errorMessage", "Game not found");
          }

          // ✅ broadcast updated game to all viewers
          io.to(gameId).emit("gameUpdated", game);
          console.log(`📡 Game ${gameId} updated by some bozo`);
        } catch (err) {
          console.error("Socket update error:", err);
          socket.emit("errorMessage", "Update failed");
        }
    });
    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

export default initGameSockets;
