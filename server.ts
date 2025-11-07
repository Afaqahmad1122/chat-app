// Load .env.local file FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import dbConnect from "./lib/db";
import { initializeSocket } from "./lib/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Connect to database first
  await dbConnect();
  console.log("Database connected");

  const httpServer = createServer();

  // Initialize Socket.io FIRST so it can attach its handlers
  // Socket.io will handle /socket.io requests automatically
  const io = initializeSocket(httpServer);
  console.log("Socket.io initialized");

  // Then attach Next.js handler for all other requests (NOT socket.io)
  httpServer.on("request", async (req, res) => {
    // Skip socket.io requests - let socket.io handle them
    if (req.url?.startsWith("/socket.io")) {
      return;
    }

    try {
      const parsedUrl = parse(req.url || "", true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("internal server error");
      }
    }
  });

  httpServer.listen(port, (err?: Error) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
