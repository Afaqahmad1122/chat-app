import { NextRequest, NextResponse } from "next/server";
import Message from "@/lib/models/Message";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get room from query params
    const { searchParams } = new URL(request.url);
    const room = searchParams.get("room") || "general";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Fetch messages
    const messages = await Message.find({ room })
      .populate("sender", "username email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Reverse to show oldest first
    const reversedMessages = messages.reverse().map((msg: any) => ({
      id: msg._id.toString(),
      sender: {
        id: msg.sender._id.toString(),
        username: msg.sender.username,
      },
      content: msg.content,
      room: msg.room,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({ messages: reversedMessages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
