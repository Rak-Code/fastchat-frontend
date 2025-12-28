import { NextRequest } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, message } = body

    // Validation
    if (!conversationId || !message) {
      return new Response("Missing required fields", { status: 400 })
    }

    if (message.trim().length === 0) {
      return new Response("Message cannot be empty", { status: 400 })
    }

    if (message.length > 4000) {
      return new Response("Message too long (max 4000 characters)", { status: 400 })
    }

    // Forward the streaming request to the backend
    const response = await fetch(`${BACKEND_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId,
        message: message.trim(),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Failed to send message")
      return new Response(errorText, { status: response.status })
    }

    // Return the streaming response directly
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in streaming chat:", error)
    return new Response("Failed to send message", { status: 500 })
  }
}