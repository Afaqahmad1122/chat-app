import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { verifyToken } from "./auth";
import User from "./models/User";
import Message from "./models/Message";

interface SocketUser {
  userId: string;
  username: string;
  socketId: string;
}

const connectedUsers = new Map<string, SocketUser>();

export function initializeSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      console.log(
        "Socket auth attempt - Token received:",
        token ? "Yes" : "No"
      );

      if (!token) {
        console.log("Socket auth error: No token provided");
        return next(new Error("Authentication error: No token provided"));
      }

      // Remove "Bearer " prefix if present
      const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

      const decoded = verifyToken(cleanToken);

      if (!decoded) {
        console.log("Socket auth error: Token verification failed");
        console.log("Token (first 20 chars):", cleanToken.substring(0, 20));
        return next(new Error("Authentication error: Invalid token"));
      }

      console.log("Token decoded successfully, userId:", decoded.userId);

      const user = await User.findById(decoded.userId);

      if (!user) {
        console.log(
          "Socket auth error: User not found for userId:",
          decoded.userId
        );
        return next(new Error("Authentication error: User not found"));
      }

      socket.data.userId = user._id.toString();
      socket.data.username = user.username;
      console.log("Socket authenticated successfully for user:", user.username);
      next();
    } catch (error) {
      console.error("Socket auth exception:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    const username = socket.data.username;

    // Store connected user
    connectedUsers.set(userId, {
      userId,
      username,
      socketId: socket.id,
    });

    console.log(`User connected: ${username} (${userId})`);

    // Broadcast user joined
    io.emit("user_connected", {
      userId,
      username,
      onlineUsers: Array.from(connectedUsers.values()),
    });

    // Handle join room
    socket.on("join_room", (room: string) => {
      socket.join(room);
      console.log(`${username} joined room: ${room}`);
    });

    // Handle send message
    socket.on(
      "send_message",
      async (data: { content: string; room?: string }) => {
        try {
          const { content, room = "general" } = data;

          // Save message to database
          const message = await Message.create({
            sender: userId,
            content,
            room,
          });

          // Populate sender info
          await message.populate("sender", "username email");

          // Broadcast message to room
          io.to(room).emit("receive_message", {
            id: message._id,
            sender: {
              id: message.sender._id,
              username: (message.sender as any).username,
            },
            content: message.content,
            room: message.room,
            createdAt: message.createdAt,
          });

          console.log(`Message sent by ${username} in ${room}`);
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // Handle typing indicator
    socket.on("typing", (data: { room?: string; isTyping: boolean }) => {
      const { room = "general", isTyping } = data;
      socket.to(room).emit("user_typing", {
        userId,
        username,
        isTyping,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      connectedUsers.delete(userId);
      console.log(`User disconnected: ${username}`);

      io.emit("user_disconnected", {
        userId,
        username,
        onlineUsers: Array.from(connectedUsers.values()),
      });
    });
  });

  return io;
}
