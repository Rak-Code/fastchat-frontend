import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:8080"

export async function POST() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn(`Backend session endpoint returned status ${response.status}. Generating fallback session ID.`)
      const conversationId = crypto.randomUUID()
      return NextResponse.json({ conversationId })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.warn("Backend unreachable for session creation, generating fallback session ID:", error)
    const conversationId = crypto.randomUUID()
    return NextResponse.json({ conversationId })
  }
}