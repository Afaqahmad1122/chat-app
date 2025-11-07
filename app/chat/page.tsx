'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/socket-client';
import ChatWindow from '@/components/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { socket, isConnected } = useSocket(token);

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      router.push('/');
      return;
    }

    setToken(storedToken);
    setCurrentUser(JSON.parse(storedUser));
  }, [router]);

  if (!token || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100">
      {isConnected ? (
        <ChatWindow socket={socket} currentUserId={currentUser.id} />
      ) : (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600">Connecting to chat...</p>
          </div>
        </div>
      )}
    </div>
  );
}

