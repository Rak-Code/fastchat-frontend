import { useState, useCallback } from 'react'

export interface StreamingChatOptions {
  conversationId: string
  onChunk?: (chunk: string) => void
  onComplete?: (fullMessage: string) => void
  onError?: (error: string) => void
}

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false)

  const streamChat = useCallback(async (
    message: string,
    options: StreamingChatOptions
  ) => {
    const { conversationId, onChunk, onComplete, onError } = options

    if (!message.trim() || !conversationId) {
      onError?.('Message and conversation ID are required')
      return
    }

    setIsStreaming(true)
    let fullMessage = ''

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message: message.trim(),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to send message')
        throw new Error(errorText)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      const decoder = new TextDecoder()

      while (true) {
        const { value, done } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        
        // Handle Server-Sent Events format
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6) // Remove 'data: ' prefix
            if (data.trim() && data !== '[DONE]') {
              fullMessage += data
              onChunk?.(data)
            }
          } else if (line.trim() && !line.startsWith(':')) {
            // Handle plain text chunks (non-SSE format)
            fullMessage += line
            onChunk?.(line)
          }
        }
      }

      onComplete?.(fullMessage)
    } catch (error) {
      console.error('Streaming error:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsStreaming(false)
    }
  }, [])

  return {
    streamChat,
    isStreaming,
  }
}