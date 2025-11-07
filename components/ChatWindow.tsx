"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface Message {
  id: string;
  sender: {
    id: string;
    username: string;
  };
  content: string;
  createdAt: string;
}

interface ChatWindowProps {
  socket: Socket | null;
  currentUserId?: string;
  room?: string;
}

export default function ChatWindow({
  socket,
  currentUserId,
  room = "general",
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit("join_room", room);

    // Listen for new messages
    socket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for user connected
    socket.on("user_connected", (data: { onlineUsers: any[] }) => {
      setOnlineUsers(data.onlineUsers);
    });

    // Listen for user disconnected
    socket.on("user_disconnected", (data: { onlineUsers: any[] }) => {
      setOnlineUsers(data.onlineUsers);
    });

    // Listen for typing indicator
    socket.on(
      "user_typing",
      (data: { username: string; isTyping: boolean }) => {
        // You can add typing indicator UI here
        console.log(
          `${data.username} is ${data.isTyping ? "typing" : "not typing"}`
        );
      }
    );

    return () => {
      socket.off("receive_message");
      socket.off("user_connected");
      socket.off("user_disconnected");
      socket.off("user_typing");
    };
  }, [socket, room]);

  // Load previous messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`/api/messages?room=${room}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [room]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-lg">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Chat Room: {room}</h1>
          <p className="text-sm opacity-90">
            {onlineUsers.length} user{onlineUsers.length !== 1 ? "s" : ""}{" "}
            online
          </p>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} currentUserId={currentUserId} />

      {/* Input */}
      <MessageInput socket={socket} room={room} />
    </div>
  );
}
