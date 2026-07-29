
import { NextResponse } from "next/server"
import { getBackendUrl, logEnvironmentConfig } from "@/lib/config"

const BACKEND_URL = getBackendUrl()

// Debug logging for environment variables (only log in development)
logEnvironmentConfig('chat')

/** Parse a meaningful error message from a backend error response body. */
function parseBackendError(errorData: Record<string, unknown>, fallback: string): string {
  // Backend GlobalExceptionHandler uses "message" key, not "error"
  return (errorData?.message as string) || (errorData?.error as string) || fallback
}

/** Create a timeout wrapper for fetch requests */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - backend server took too long to respond')
    }
    throw error
  }
}

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

      let response: Response
      try {
        response = await fetchWithTimeout(`${BACKEND_URL}/api/chat`, {
          method: "POST",
          body: backendFormData,
        })
      } catch (fetchErr: unknown) {
        console.error("[chat/multipart] Backend unreachable at", BACKEND_URL, fetchErr)
        const error = fetchErr as Error
        console.error("[chat/multipart] Full error details:", {
          name: error?.name,
          message: error?.message,
          cause: error?.cause
        })
        
        return NextResponse.json(
          { 
            error: "Backend server is not reachable. Please try again in a few moments.",
            debug: process.env.NODE_ENV !== 'production' ? {
              backendUrl: BACKEND_URL,
              errorName: error?.name,
              errorMessage: error?.message
            } : undefined
          },
          { status: 503 }
        )
      }

      if (!response.ok) {
        if (response.status === 413) {
          return NextResponse.json({ error: "File too large" }, { status: 413 })
        }
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = parseBackendError(errorData, "Failed to send message")
        console.error("[chat/multipart] Backend returned", response.status, errorMsg, errorData)
        return NextResponse.json({ error: errorMsg }, { status: response.status })
      }

      const data = await response.json()

      // Validate response structure
      if (!data.reply) {
        console.error("[chat/multipart] Invalid response structure:", data)
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

    let response: Response
    try {
      response = await fetchWithTimeout(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: message.trim(),
        }),
      })
    } catch (fetchErr: unknown) {
      console.error("[chat/json] Backend unreachable at", BACKEND_URL, fetchErr)
      const error = fetchErr as Error
      console.error("[chat/json] Full error details:", {
        name: error?.name,
        message: error?.message,
        cause: error?.cause
      })
      
      return NextResponse.json(
        { 
          error: "Backend server is not reachable. Please try again in a few moments.",
          debug: process.env.NODE_ENV !== 'production' ? {
            backendUrl: BACKEND_URL,
            errorName: error?.name,
            errorMessage: error?.message
          } : undefined
        },
        { status: 503 }
      )
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = parseBackendError(errorData, "Failed to send message")
      console.error("[chat/json] Backend returned", response.status, errorMsg, errorData)
      return NextResponse.json({ error: errorMsg }, { status: response.status })
    }

    const data = await response.json()

    // Validate response structure
    if (!data.reply) {
      console.error("[chat/json] Invalid response structure:", data)
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
  } catch (error: unknown) {
    console.error("[chat] Unhandled error:", error)
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 })
  }
}
