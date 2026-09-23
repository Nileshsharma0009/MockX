import { Server } from "socket.io";
import { createCorsOptions } from "../config/runtimeConfig.js";

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: createCorsOptions()
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`🔌 Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  } else {
    console.warn("⚠️ Cannot emit socket event, io is not initialized");
  }
};
