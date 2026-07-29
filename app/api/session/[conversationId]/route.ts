import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:8080"

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
  } catch (error) {
    console.error("Error deleting session:", error)
    return new NextResponse(null, { status: 204 })
  }
}