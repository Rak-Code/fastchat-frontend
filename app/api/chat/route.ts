import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { conversationId, message } = body

    // Validation
    if (!conversationId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (message.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: "Message too long (max 4000 characters)" }, { status: 400 })
    }

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
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
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to send message")
    }

    const data = await response.json()
    
    // Validate response structure
    if (!data.reply) {
      console.error('Invalid response structure:', data)
      return NextResponse.json({ error: "Invalid response from backend" }, { status: 500 })
    }
    
    // Clean up the reply content to handle potential formatting issues
    const cleanReply = data.reply
      .replace(/^\*\*\s*$/, '') // Remove standalone **
      .replace(/^\*\s*$/, '') // Remove standalone *
      .trim()
    
    return NextResponse.json({
      ...data,
      reply: cleanReply
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
