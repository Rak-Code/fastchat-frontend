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

    // Create a proper streaming response that handles the backend SSE format
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { value, done } = await reader.read()
            
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            
            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || ''
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data && data !== '[DONE]') {
                  // Send as proper SSE format
                  controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
                }
              }
            }
          }
          
          // Handle any remaining buffer content
          if (buffer.trim()) {
            const lines = buffer.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data && data !== '[DONE]') {
                  controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
                }
              }
            }
          }
          
        } catch (error) {
          console.error('Stream processing error:', error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
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