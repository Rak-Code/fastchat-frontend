import { NextRequest, NextResponse } from "next/server"
import { getBackendUrl, logEnvironmentConfig } from "@/lib/config"

const BACKEND_URL = getBackendUrl()

// Debug logging for environment variables (only log in development)
logEnvironmentConfig('session-delete')

export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    const response = await fetch(`${BACKEND_URL}/api/session/${conversationId}`, {
      method: "DELETE",
    }).catch(() => null)

    if (!response || !response.ok) {
      console.warn("Backend session deletion returned non-OK or failed:", conversationId)
    }

    return new NextResponse(null, { status: 204 })
  } catch (error: unknown) {
    console.error("Error deleting session:", error)
    return new NextResponse(null, { status: 204 })
  }
}
