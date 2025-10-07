// middleware/socketAuth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("role name");

    if (!user) return next(new Error("User not found"));

    socket.user = user; // attach user to socket
    next();
  } catch (err) {
    console.error("Socket auth error:", err.message);
    next(new Error("Unauthorized"));
  }
};

