chat-app/
├── app/
│ ├── api/
│ │ ├── auth/ # Authentication routes
│ │ ├── messages/ # Message CRUD
│ │ └── socket/ # Socket.io handler
│ ├── (auth)/ # Login/Signup pages
│ ├── chat/ # Chat interface
│ └── layout.tsx
├── lib/
│ ├── db.ts # MongoDB connection
│ ├── socket.ts # Socket.io server setup
│ └── models/ # Mongoose models
│ ├── User.ts
│ └── Message.ts
├── components/
│ ├── ChatWindow.tsx
│ ├── MessageList.tsx
│ ├── MessageInput.tsx
│ └── OnlineUsers.tsx
└── package.json
