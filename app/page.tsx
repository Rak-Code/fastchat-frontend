"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, RotateCcw, Loader2 } from "lucide-react"

type Message = {
  type: "user" | "ai"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input field after messages update (especially after AI response)
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [messages, isLoading])

  // Create session on mount
  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await fetch("/api/session", {
          method: "POST",
        })

        if (!response.ok) {
          throw new Error("Failed to create session")
        }

        const data = await response.json()
        setConversationId(data.conversationId)

        // Store in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("fastchat_conversation_id", data.conversationId)
        }
      } catch (err) {
        console.error("Error creating session:", err)
        setError("Failed to initialize chat. Please refresh the page.")
      }
    }

    // Check for existing conversation ID
    const existingId = typeof window !== "undefined" ? localStorage.getItem("fastchat_conversation_id") : null

    if (existingId) {
      setConversationId(existingId)
    } else {
      createSession()
    }
  }, [])

  const handleSend = async () => {
    if (!input.trim() || !conversationId || isLoading) return

    const userMessage = input.trim()

    // Clear input and error
    setInput("")
    setError(null)

    // Add user message immediately
    setMessages((prev) => [...prev, { type: "user", content: userMessage }])

    // Show loading state
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to send message")
      }

      const data = await response.json()

      // Add AI response
      setMessages((prev) => [...prev, { type: "ai", content: data.reply }])
      
      // Focus input field after AI response is added
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Something went wrong. Please try again.")

      // Remove the user message if the request failed
      setMessages((prev) => prev.slice(0, -1))
      // Restore the input
      setInput(userMessage)
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleClearChat = async () => {
    if (!conversationId) return

    try {
      await fetch(`/api/session/${conversationId}`, {
        method: "DELETE",
      })

      // Clear messages
      setMessages([])

      // Create new session
      const response = await fetch("/api/session", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setConversationId(data.conversationId)

        if (typeof window !== "undefined") {
          localStorage.setItem("fastchat_conversation_id", data.conversationId)
        }
      }

      setError(null)
    } catch (err) {
      console.error("Error clearing chat:", err)
      setError("Failed to clear chat. Please refresh the page.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">FastChat</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground">Start a Conversation</h2>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.type === "user" ? "bg-muted text-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted text-foreground">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <div className="bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-4">
          {error && <div className="mb-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                disabled={!conversationId || isLoading}
                className="min-h-[48px] max-h-[200px] resize-none rounded-full px-5 py-3"
                rows={1}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={!input.trim() || !conversationId || isLoading}
              size="icon"
              className="h-12 w-12 shrink-0 rounded-full"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              <span className="sr-only">Send message</span>
            </Button>
          </div>

          <p className="mt-2 text-xs text-center text-muted-foreground">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
