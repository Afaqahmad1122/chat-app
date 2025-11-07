'use client';

import { useState, FormEvent } from 'react';
import { Socket } from 'socket.io-client';

interface MessageInputProps {
  socket: Socket | null;
  room?: string;
}

export default function MessageInput({ socket, room = 'general' }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !socket) return;

    socket.emit('send_message', {
      content: message.trim(),
      room,
    });

    setMessage('');
    setIsTyping(false);
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      socket?.emit('typing', { room, isTyping: true });
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      socket?.emit('typing', { room, isTyping: false });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </form>
  );
}

