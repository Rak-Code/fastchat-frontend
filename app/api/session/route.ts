import { NextResponse } from "next/server"
import { getBackendUrl, logEnvironmentConfig } from "@/lib/config"

const BACKEND_URL = getBackendUrl()

// Debug logging for environment variables (only log in development)
logEnvironmentConfig('session')

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
  } catch (error: unknown) {
    console.warn("Backend unreachable for session creation, generating fallback session ID:", error)
    const conversationId = crypto.randomUUID()
    return NextResponse.json({ conversationId })
  }
}
