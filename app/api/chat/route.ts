import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || ""

    // Handle multipart/form-data (file uploads)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const conversationId = formData.get("conversationId") as string | null
      const message = formData.get("message") as string | null
      const file = formData.get("file") as File | null

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

      // Validate file size (10 MB max)
      if (file && file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large. Maximum size is 10 MB." }, { status: 413 })
      }

      // Forward to backend as multipart/form-data
      const backendFormData = new FormData()
      backendFormData.append("conversationId", conversationId)
      backendFormData.append("message", message.trim())
      if (file) {
        backendFormData.append("file", file)
      }

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        body: backendFormData,
      })

      if (!response.ok) {
        if (response.status === 413) {
          return NextResponse.json({ error: "File too large" }, { status: 413 })
        }
        const errorData = await response.json().catch(() => ({}))
        return NextResponse.json(
          { error: errorData.error || "Failed to send message" },
          { status: response.status },
        )
      }

      const data = await response.json()

      // Validate response structure
      if (!data.reply) {
        console.error("Invalid response structure:", data)
        return NextResponse.json({ error: "Invalid response from backend" }, { status: 500 })
      }

      // Clean up the reply content
      const cleanReply = data.reply
        .replace(/^\*\*\s*$/, "")
        .replace(/^\*\s*$/, "")
        .trim()

      return NextResponse.json({
        ...data,
        reply: cleanReply,
        hasAttachment: true,
      })
    }

    // Handle application/json (text-only messages - backward compatible)
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
      console.error("Invalid response structure:", data)
      return NextResponse.json({ error: "Invalid response from backend" }, { status: 500 })
    }

    // Clean up the reply content to handle potential formatting issues
    const cleanReply = data.reply
      .replace(/^\*\*\s*$/, "")
      .replace(/^\*\s*$/, "")
      .trim()

    return NextResponse.json({
      ...data,
      reply: cleanReply,
      hasAttachment: false,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}