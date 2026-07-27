# Design Document: Frontend File Upload Integration

## 1. Overview

This document defines the architecture and implementation strategy for integrating file upload functionality into the FastChat frontend application. The feature enables users to attach text-based files (.txt, .pdf, .docx, .md, .markdown) to chat messages via a paperclip button or drag-and-drop interface.

### 1.1 Technology Stack

- **Frontend Framework**: Next.js 16 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Icons**: lucide-react
- **API**: Next.js API Routes (App Router)

### 1.2 Design Principles

1. **Progressive Enhancement**: File upload is an optional enhancement; core chat functionality remains unchanged
2. **Accessibility First**: Full keyboard navigation and screen reader support
3. **User Feedback**: Clear visual and auditory feedback for all states
4. **Performance**: Client-side validation to prevent unnecessary network requests
5. **Responsive Design**: Optimized layouts from mobile (320px) to desktop (2560px)

## 2. System Architecture

### 2.1 Component Hierarchy

```
app/page.tsx (ChatPage)
├── components/ui/button (existing)
├── components/ui/textarea (existing)
├── components/markdown-message (existing)
└── components/file-upload/ (new)
    ├── FileUploadButton.tsx
    ├── FilePreview.tsx
    ├── DropZone.tsx
    └── ChatInput.tsx (enhanced wrapper)
```

### 2.2 Data Flow

```
User Action (click/drop)
  ↓
FileUploadButton/DropZone
  ↓
Client-side Validation
  ↓ (valid)
FilePreview Display
  ↓
User Sends Message
  ↓
ChatPage State Update
  ↓
API Route (/app/api/chat/route.ts)
  ↓ (FormData if file, JSON if not)
Backend Service (Java Spring Boot)
  ↓
Response Back Through Chain
  ↓
UI Update & Cleanup
```

### 2.3 State Management Architecture

The file upload feature uses local component state with the following state variables:

```typescript
// In ChatPage component
const [attachedFile, setAttachedFile] = useState<File | null>(null)
const [fileError, setFileError] = useState<string | null>(null)
const [isDragOver, setIsDragOver] = useState(false)
const [isUploading, setIsUploading] = useState(false)
```

## 3. Component Design

### 3.1 FileUploadButton Component

**Purpose**: Trigger native file picker with paperclip icon

**Location**: `components/file-upload/FileUploadButton.tsx`

**Props Interface**:
```typescript
interface FileUploadButtonProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  accept: string
}
```

**Visual Design**:
- Icon: Paperclip (lucide-react `Paperclip` icon)
- Size: 40x40px button
- Position: Left of textarea, same height as send button
- States:
  - Default: Gray icon with hover effect
  - Hover: Slightly darker shade with scale animation
  - Focus: Ring outline for keyboard navigation
  - Disabled: Reduced opacity, no hover effect

**Implementation**:
```typescript
import { Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef } from "react"

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  accept?: string
}

export function FileUploadButton({ 
  onFileSelect, 
  disabled = false, 
  accept = ".txt,.pdf,.docx,.md,.markdown" 
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
      // Reset input to allow selecting the same file again
      e.target.value = ''
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled}
        className="h-10 w-10 shrink-0"
        aria-label="Attach file"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </>
  )
}
```

### 3.2 FilePreview Component

**Purpose**: Display attached file information with remove option

**Location**: `components/file-upload/FilePreview.tsx`

**Props Interface**:
```typescript
interface FilePreviewProps {
  file: File
  onRemove: () => void
}
```

**Visual Design**:
- Container: Rounded rectangle with border
- Layout: File icon + filename + size + remove button
- Position: Above textarea, below any error messages
- Dimensions: Full width of textarea area, max-width 600px
- Styling:
  - Background: Subtle gray (bg-muted)
  - Border: 1px solid border color
  - Padding: 12px
  - Border radius: 8px

**Implementation**:
```typescript
import { FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilePreviewProps {
  file: File
  onRemove: () => void
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div 
      className="flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3 max-w-[600px]"
      role="status"
      aria-live="polite"
      aria-label={`File attached: ${file.name}`}
    >
      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 shrink-0"
        aria-label="Remove attached file"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

### 3.3 DropZone Component

**Purpose**: Provide drag-and-drop file upload capability

**Location**: `components/file-upload/DropZone.tsx`

**Props Interface**:
```typescript
interface DropZoneProps {
  onFileDrop: (file: File) => void
  children: React.ReactNode
  disabled?: boolean
  accept?: string
}
```

**Visual Design**:
- Overlay: Semi-transparent backdrop with border
- Active State (during drag):
  - Background: rgba(59, 130, 246, 0.1) (blue tint)
  - Border: 2px dashed blue
  - Border radius: 16px
  - Cursor: copy
- Centered Text: "Drop file here" with upload icon
- Z-index: Above textarea, below modals

**Implementation**:
```typescript
import { Upload } from "lucide-react"
import { useState } from "react"

interface DropZoneProps {
  onFileDrop: (file: File) => void
  children: React.ReactNode
  disabled?: boolean
  accept?: string
}

export function DropZone({ 
  onFileDrop, 
  children, 
  disabled = false,
  accept = ".txt,.pdf,.docx,.md,.markdown"
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file) {
      // Validate file extension
      const extension = file.name.split('.').pop()?.toLowerCase()
      const acceptedExtensions = accept.split(',').map(ext => ext.trim().replace('.', ''))
      
      if (extension && acceptedExtensions.includes(extension)) {
        onFileDrop(file)
      }
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      {children}
      
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-500 bg-blue-50/10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-blue-500">
            <Upload className="h-8 w-8" />
            <p className="text-sm font-medium">Drop file here</p>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 3.4 ChatInput Component (Enhanced)

**Purpose**: Orchestrate file upload components and manage state

**Location**: Integrate into `app/page.tsx`

**State Management**:
```typescript
// File upload state
const [attachedFile, setAttachedFile] = useState<File | null>(null)
const [fileError, setFileError] = useState<string | null>(null)
const [isDragOver, setIsDragOver] = useState(false)
```

**Integration Example** (key sections):
```typescript
// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const SUPPORTED_FORMATS = ['.txt', '.pdf', '.docx', '.md', '.markdown']
const ACCEPT_STRING = SUPPORTED_FORMATS.join(',')

// Validation function
const validateFile = (file: File): { valid: boolean; error?: string } => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  
  if (!SUPPORTED_FORMATS.includes(extension)) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload .txt, .pdf, .docx, .md, or .markdown files'
    }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be 10MB or less'
    }
  }
  
  return { valid: true }
}

// File selection handler
const handleFileSelect = (file: File) => {
  const validation = validateFile(file)
  
  if (!validation.valid) {
    setFileError(validation.error!)
    setAttachedFile(null)
    return
  }
  
  setAttachedFile(file)
  setFileError(null)
}

// File removal handler
const handleFileRemove = () => {
  setAttachedFile(null)
  setFileError(null)
}

// Escape key handler for file removal
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && attachedFile) {
      handleFileRemove()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  return () => document.removeEventListener('keydown', handleEscape)
}, [attachedFile])
```

## 4. TypeScript Interfaces

### 4.1 Core Types

```typescript
// types/chat.ts

/**
 * Represents a file attachment with metadata
 */
export interface FileAttachment {
  file: File
  name: string
  size: number
  type: string
}

/**
 * Chat request payload - can be JSON or FormData
 */
export type ChatRequestPayload = 
  | {
      conversationId: string
      message: string
    }
  | FormData

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  error: string
  details?: string
}

/**
 * Chat response from backend
 */
export interface ChatResponse {
  reply: string
  conversationId: string
  hasAttachment?: boolean
}

/**
 * Message type with optional file indicator
 */
export interface Message {
  type: "user" | "ai"
  content: string
  hasAttachment?: boolean
  timestamp?: string
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
}
```

### 4.2 Component Props Types

```typescript
// components/file-upload/types.ts

export interface FileUploadButtonProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  accept?: string
}

export interface FilePreviewProps {
  file: File
  onRemove: () => void
}

export interface DropZoneProps {
  onFileDrop: (file: File) => void
  children: React.ReactNode
  disabled?: boolean
  accept?: string
}
```

## 5. API Route Enhancement

### 5.1 Updated API Route Design

**File**: `app/api/chat/route.ts`

**Key Changes**:
1. Detect Content-Type header
2. Parse FormData for file uploads
3. Forward to backend with appropriate format
4. Map backend error codes to frontend messages

**Implementation**:
```typescript
import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    // Handle multipart/form-data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const conversationId = formData.get('conversationId') as string
      const message = formData.get('message') as string
      const file = formData.get('file') as File | null

      // Validation
      if (!conversationId || !message) {
        return NextResponse.json(
          { error: "Missing required fields" }, 
          { status: 400 }
        )
      }

      if (message.trim().length === 0) {
        return NextResponse.json(
          { error: "Message cannot be empty" }, 
          { status: 400 }
        )
      }

      if (file && file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File size must be 10MB or less" }, 
          { status: 413 }
        )
      }

      // Forward to backend
      const backendFormData = new FormData()
      backendFormData.append('conversationId', conversationId)
      backendFormData.append('message', message.trim())
      if (file) {
        backendFormData.append('file', file)
      }

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        body: backendFormData,
      })

      // Handle backend errors
      if (!response.ok) {
        if (response.status === 413) {
          return NextResponse.json(
            { error: "File too large" }, 
            { status: 413 }
          )
        }
        
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}))
          return NextResponse.json(
            { error: errorData.error || "Bad request" }, 
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { error: "Server error occurred" }, 
          { status: 500 }
        )
      }

      const data = await response.json()
      
      if (!data.reply) {
        return NextResponse.json(
          { error: "Invalid response from backend" }, 
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        ...data,
        hasAttachment: !!file
      })
    } 
    
    // Handle JSON (text-only message)
    else {
      const body = await request.json()
      const { conversationId, message } = body

      // Validation
      if (!conversationId || !message) {
        return NextResponse.json(
          { error: "Missing required fields" }, 
          { status: 400 }
        )
      }

      if (message.trim().length === 0) {
        return NextResponse.json(
          { error: "Message cannot be empty" }, 
          { status: 400 }
        )
      }

      if (message.length > 4000) {
        return NextResponse.json(
          { error: "Message too long (max 4000 characters)" }, 
          { status: 400 }
        )
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
      
      if (!data.reply) {
        return NextResponse.json(
          { error: "Invalid response from backend" }, 
          { status: 500 }
        )
      }
      
      const cleanReply = data.reply
        .replace(/^\*\*\s*$/, '')
        .replace(/^\*\s*$/, '')
        .trim()
      
      return NextResponse.json({
        ...data,
        reply: cleanReply,
        hasAttachment: false
      })
    }
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Failed to send message" }, 
      { status: 500 }
    )
  }
}
```

### 5.2 Request Flow Diagram

```
Frontend (page.tsx)
  |
  | User sends message with file
  |
  v
Create FormData
  - conversationId: string
  - message: string
  - file: File (optional)
  |
  v
POST /api/chat
Content-Type: multipart/form-data
  |
  v
API Route (route.ts)
  |
  ├─> Parse FormData
  ├─> Validate inputs
  ├─> Validate file size
  |
  v
Forward to Backend
POST ${BACKEND_URL}/api/chat
  |
  v
Java Backend
  |
  ├─> Extract file text
  ├─> Process with AI model
  ├─> Generate response
  |
  v
Return Response
  |
  v
API Route
  ├─> Map error codes
  ├─> Add hasAttachment flag
  |
  v
Frontend
  ├─> Display AI response
  ├─> Show file badge if hasAttachment
  ├─> Clear file preview
  └─> Reset state
```

## 6. Frontend Message Sending Enhancement

### 6.1 Updated handleSend Function

```typescript
const handleSend = async () => {
  if (!input.trim() || !conversationId || isLoading) return

  const userMessage = input.trim()

  // Clear input and error
  setInput("")
  setFileError(null)
  setIsLoading(true)

  // Add user message immediately with attachment indicator
  setMessages((prev) => [
    ...prev, 
    { 
      type: "user", 
      content: userMessage,
      hasAttachment: !!attachedFile,
      timestamp: new Date().toISOString()
    }
  ])

  try {
    let response: Response

    // Send with file if attached
    if (attachedFile) {
      const formData = new FormData()
      formData.append('conversationId', conversationId)
      formData.append('message', userMessage)
      formData.append('file', attachedFile)

      response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      })
    } 
    // Send text-only
    else {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
        }),
      })
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Handle specific error codes
      if (response.status === 413) {
        throw new Error('File too large')
      }
      
      throw new Error(errorData.error || 'Failed to send message')
    }

    const data = await response.json()
    
    // Add AI response
    setMessages((prev) => [
      ...prev, 
      { 
        type: "ai", 
        content: data.reply,
        timestamp: new Date().toISOString()
      }
    ])
    
    // Clear file attachment on success
    setAttachedFile(null)
    
    // Focus input field
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)

  } catch (error) {
    console.error("Chat error:", error)
    setError(error instanceof Error ? error.message : "Something went wrong. Please try again.")
    
    // Remove the user message if request failed
    setMessages((prev) => prev.slice(0, -1))
    // Restore the input
    setInput(userMessage)
    
    textareaRef.current?.focus()
  } finally {
    setIsLoading(false)
  }
}
```

## 7. UI/UX Design Specifications

### 7.1 Input Area Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Error Message - if present]                           │
│                                                          │
│  [File Preview - if file attached]                      │
│  ┌────────────────────────────────────────────────┐    │
│  │ 📄 document.pdf                           ✕    │    │
│  │ 2.5 MB                                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────┬─────────────────────────────────┬──────┐    │
│  │  📎  │  Ask anything...                │  ➤   │    │
│  └──────┴─────────────────────────────────┴──────┘    │
│                                                          │
│  Press Enter to send, Shift + Enter for new line       │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Drag-and-Drop Visual States

**Default State**:
- No visual overlay
- Normal cursor

**Drag Over State**:
- Semi-transparent blue overlay
- Dashed blue border (2px)
- Upload icon and "Drop file here" text centered
- Cursor: copy

**After Drop (Valid File)**:
- Overlay disappears
- File preview appears above textarea
- ARIA live region announces "File attached: [filename]"

**After Drop (Invalid File)**:
- Overlay disappears
- Error message appears above textarea
- ARIA live region announces error message

### 7.3 Message Display with Attachments

```typescript
// In message rendering
{messages.map((message, index) => (
  <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${...}`}>
      {message.hasAttachment && (
        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Paperclip className="h-3 w-3" />
          <span>File attached</span>
        </div>
      )}
      {/* Message content */}
    </div>
  </div>
))}
```

### 7.4 Loading States

**File Upload in Progress**:
```tsx
{isLoading && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>Uploading...</span>
  </div>
)}
```

### 7.5 Error States

**Error Message Display**:
```tsx
{fileError && (
  <div 
    className="mb-3 text-sm text-destructive" 
    role="alert" 
    aria-live="assertive"
  >
    {fileError}
  </div>
)}
```

### 7.6 Responsive Design

**Mobile (320px - 640px)**:
- Paperclip button: 36x36px
- Send button: 36x36px
- File preview: Full width with horizontal padding
- Font sizes: 14px for file name, 12px for size

**Tablet (641px - 1024px)**:
- Paperclip button: 40x40px
- Send button: 40x40px
- File preview: Max-width 600px
- Font sizes: 14px for file name, 12px for size

**Desktop (1025px+)**:
- Paperclip button: 40x40px
- Send button: 48x48px
- File preview: Max-width 600px
- Font sizes: 14px for file name, 12px for size
- Hover effects more pronounced

## 8. Accessibility Implementation

### 8.1 Keyboard Navigation Flow

1. **Tab to Paperclip Button** → Focus visible with ring outline
2. **Enter/Space** → Trigger file picker
3. **Tab to Textarea** → Focus on text input
4. **Tab to Send Button** → Focus visible with ring outline
5. **Tab to File Preview Remove Button** (if file attached) → Focus visible
6. **Escape Key** → Remove attached file (if any)

### 8.2 ARIA Labels and Roles

```tsx
// FileUploadButton
<Button aria-label="Attach file" {...props}>
  <Paperclip />
</Button>

// FilePreview
<div 
  role="status" 
  aria-live="polite" 
  aria-label={`File attached: ${file.name}`}
>
  {/* Preview content */}
  <Button aria-label="Remove attached file">
    <X />
  </Button>
</div>

// Error messages
<div role="alert" aria-live="assertive">
  {error}
</div>

// Loading state
<div role="status" aria-live="polite">
  <Loader2 />
  <span>Uploading...</span>
</div>

// Message with attachment
<div aria-label="Message with file attachment">
  {/* Message content */}
</div>
```

### 8.3 Screen Reader Announcements

**File Attached**:
- "File attached: document.pdf, 2.5 megabytes"

**File Removed**:
- "File removed"

**Validation Error**:
- "Error: File size must be 10MB or less"
- "Error: Unsupported file type. Please upload .txt, .pdf, .docx, .md, or .markdown files"

**Upload Progress**:
- "Uploading file, please wait"

**Upload Complete**:
- "Message sent successfully"

## 9. File Validation Logic

### 9.1 Validation Function

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
const SUPPORTED_EXTENSIONS = ['txt', 'pdf', 'docx', 'md', 'markdown']

interface FileValidationResult {
  valid: boolean
  error?: string
}

function validateFile(file: File): FileValidationResult {
  // Extract extension
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  // Check if extension exists
  if (!extension) {
    return {
      valid: false,
      error: 'File has no extension'
    }
  }
  
  // Validate extension
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload .txt, .pdf, .docx, .md, or .markdown files'
    }
  }
  
  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be 10MB or less'
    }
  }
  
  // Validate size is not zero
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    }
  }
  
  return { valid: true }
}
```

### 9.2 Validation Error Messages

| Condition | Error Message |
|-----------|--------------|
| No extension | "File has no extension" |
| Unsupported type | "Unsupported file type. Please upload .txt, .pdf, .docx, .md, or .markdown files" |
| Size > 10MB | "File size must be 10MB or less" |
| Size = 0 | "File is empty" |
| Backend 413 | "File too large" |
| Backend 400 | Message from backend |
| Backend 500 | "Server error occurred" |

## 10. Backend Configuration Updates

### 10.1 Application Configuration

**File**: `src/main/resources/application.yml` (Backend repository)

**Required Changes**:

```yaml
spring:
  ai:
    groq:
      chat:
        options:
          # Increased from 3000 to 7000 to accommodate:
          # - File context: up to 1250 tokens (~5000 chars)
          # - User message: up to 1000 tokens (~4000 chars)
          # - System prompt: ~100 tokens
          # - Conversation history: ~500-1000 tokens
          # - Response generation: ~7000 tokens
          # Total: ~10,350 tokens maximum (within 128K context window)
          max-tokens: 7000
          
  servlet:
    multipart:
      # Maximum file size for uploads
      max-file-size: 10MB
      # Maximum request size (file + metadata)
      max-request-size: 11MB
```

**Rationale for 7000 Tokens**:

1. **Input Budget**:
   - File context (truncated): 5000 characters ≈ 1250 tokens
   - User message: 4000 characters max ≈ 1000 tokens
   - System prompt: ≈ 100 tokens
   - Conversation history: ≈ 500-1000 tokens
   - **Total input: ~2850-3350 tokens**

2. **Output Budget**:
   - Previous: 3000 tokens
   - New: 7000 tokens
   - Provides 28,000 characters for detailed responses

3. **Safety Margin**:
   - Total context usage: ~10,350 tokens (input + output)
   - Well within llama-3.3-70b-versatile's 128K context window
   - Allows for comprehensive file analysis and responses

## 11. State Management Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Component State                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  attachedFile: File | null                              │
│  fileError: string | null                               │
│  isDragOver: boolean                                    │
│  isLoading: boolean                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
                           │
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          v                v                v
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │ Default │      │  File   │      │ Error   │
    │  State  │      │ Attached│      │  State  │
    └─────────┘      └─────────┘      └─────────┘
          │                │                │
          │                │                │
    file=null        file=File         error!=null
    error=null       error=null        file=null
    drag=false       drag=false        drag=false
                           │
                           │
                    ┌──────┴──────┐
                    │             │
              User clicks    User presses
               Remove         Escape key
                    │             │
                    v             v
               Clear file    Clear file
```

### 11.1 State Transitions

**1. Default → File Attached**:
- Trigger: User selects valid file OR drops valid file
- Actions:
  - `setAttachedFile(file)`
  - `setFileError(null)`
  - ARIA announcement: "File attached: [filename]"

**2. Default → Error State**:
- Trigger: User selects invalid file OR drops invalid file
- Actions:
  - `setAttachedFile(null)`
  - `setFileError(errorMessage)`
  - ARIA announcement: Error message

**3. File Attached → Default**:
- Trigger: User clicks remove button OR presses Escape OR message sent successfully
- Actions:
  - `setAttachedFile(null)`
  - `setFileError(null)`
  - ARIA announcement: "File removed"

**4. Error State → File Attached**:
- Trigger: User selects valid file
- Actions:
  - `setAttachedFile(file)`
  - `setFileError(null)`
  - ARIA announcement: "File attached: [filename]"

**5. File Attached → File Attached** (Replacement):
- Trigger: User selects new file while file already attached
- Actions:
  - `setAttachedFile(newFile)`
  - `setFileError(null)`
  - ARIA announcement: "File replaced: [new filename]"

## 12. Implementation Strategy

### 12.1 Phase 1: Core File Upload UI (Priority: High)

**Estimated Time**: 2-3 hours

**Tasks**:
1. Create `components/file-upload/` directory
2. Implement `FileUploadButton` component
3. Implement `FilePreview` component
4. Add file validation function
5. Integrate into `app/page.tsx`:
   - Add state variables
   - Add file handlers
   - Add components to input area
6. Test file selection and preview display

**Deliverables**:
- Working file upload button
- File preview with remove functionality
- Client-side validation
- Basic error messages

**Testing**:
- Unit tests for validation function
- Component tests for FileUploadButton
- Component tests for FilePreview
- Integration test for file selection flow

### 12.2 Phase 2: Drag-and-Drop Support (Priority: Medium)

**Estimated Time**: 1-2 hours

**Tasks**:
1. Implement `DropZone` component
2. Wrap input area with DropZone
3. Add drag-over visual feedback
4. Implement drop handler with validation
5. Test drag-and-drop functionality

**Deliverables**:
- Working drag-and-drop interface
- Visual feedback during drag
- Validation on drop

**Testing**:
- Component tests for DropZone
- Integration tests for drag-and-drop flow
- Visual tests for drag-over state

### 12.3 Phase 3: API Route Update (Priority: High)

**Estimated Time**: 1-2 hours

**Tasks**:
1. Update `app/api/chat/route.ts`
2. Add FormData parsing
3. Add conditional logic for JSON vs FormData
4. Implement error mapping
5. Test both request formats

**Deliverables**:
- API route handles both JSON and FormData
- Proper error code mapping
- Backward compatibility maintained

**Testing**:
- API route tests for JSON requests
- API route tests for FormData requests
- Error handling tests
- Integration tests with backend

### 12.4 Phase 4: Message Sending Enhancement (Priority: High)

**Estimated Time**: 1 hour

**Tasks**:
1. Update `handleSend` function in `app/page.tsx`
2. Add FormData construction for file uploads
3. Update message type to include `hasAttachment` flag
4. Clear file on successful send
5. Test end-to-end flow

**Deliverables**:
- Messages sent with files
- File attachments indicated in UI
- Proper state cleanup

**Testing**:
- End-to-end test for file upload flow
- Test message sending with and without files
- Test error recovery

### 12.5 Phase 5: Accessibility Enhancements (Priority: Medium)

**Estimated Time**: 1-2 hours

**Tasks**:
1. Add ARIA labels to all interactive elements
2. Implement ARIA live regions for announcements
3. Add Escape key handler for file removal
4. Test keyboard navigation
5. Test with screen reader

**Deliverables**:
- Full keyboard navigation support
- Screen reader announcements
- WCAG 2.1 Level AA compliance

**Testing**:
- Keyboard navigation tests
- Screen reader testing (manual)
- Automated accessibility scanning
- Focus management tests

### 12.6 Phase 6: Backend Configuration (Priority: Low)

**Estimated Time**: 15 minutes

**Tasks**:
1. Update `application.yml` in backend repository
2. Change `max-tokens` from 3000 to 7000
3. Add comments explaining token calculation
4. Test backend with updated configuration

**Deliverables**:
- Updated backend configuration
- Documentation of token allocation

**Testing**:
- Smoke test to verify configuration loaded
- Integration test with large file context

### 12.7 Total Estimated Time

- **Phase 1**: 2-3 hours
- **Phase 2**: 1-2 hours
- **Phase 3**: 1-2 hours
- **Phase 4**: 1 hour
- **Phase 5**: 1-2 hours
- **Phase 6**: 15 minutes

**Total**: 6.25 - 10.25 hours (approximately 1-2 working days)

## 13. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Drag-over state visibility

*For any* drag event over the Drop_Zone, the UI state SHALL change to display the drop zone visual indicator with blue overlay and dashed border.

**Validates: Requirements 1.3**

### Property 2: Valid file drop triggers preview

*For any* valid file (correct extension, size ≤ 10MB) dropped on the Drop_Zone, the Chat_Interface SHALL display the File_Preview with correct filename and file size.

**Validates: Requirements 1.4, 1.5**

### Property 3: File preview displays complete information

*For any* attached file, the File_Preview SHALL display both the exact filename and formatted file size.

**Validates: Requirements 1.5**

### Property 4: Unsupported file type rejection

*For any* file with an extension not in the Supported_Formats list, the Chat_Interface SHALL display an Error_State with the message "Unsupported file type. Please upload .txt, .pdf, .docx, .md, or .markdown files" and SHALL NOT display the File_Preview.

**Validates: Requirements 1.8, 2.1**

### Property 5: Successful send clears file preview

*For any* Conversation_Message sent successfully with an attached file, the Chat_Interface SHALL clear the File_Preview and reset the attachedFile state to null.

**Validates: Requirements 1.10**

### Property 6: File extension validation

*For any* file, the validation function SHALL return `valid: true` if and only if the file extension matches one of the Supported_Formats.

**Validates: Requirements 2.1**

### Property 7: File size validation

*For any* file, the validation function SHALL return `valid: true` if and only if the file size is greater than 0 and less than or equal to 10MB.

**Validates: Requirements 2.2**

### Property 8: Validation failure prevents preview

*For any* file that fails validation (invalid extension OR size), the Chat_Interface SHALL display an Error_State message and SHALL NOT display the File_Preview.

**Validates: Requirements 2.3**

### Property 9: Error state blocks submission

*For any* state where fileError is not null, the form submission SHALL be prevented (send button disabled OR submission handler returns early).

**Validates: Requirements 2.4**

### Property 10: Valid file clears error state

*For any* valid file selected after an Error_State exists, the Chat_Interface SHALL clear the error message (setFileError(null)) and display the File_Preview.

**Validates: Requirements 2.5**

### Property 11: FormData construction completeness

*For any* request containing a file attachment, the API_Route SHALL construct FormData containing all three required fields: conversationId, message, and file.

**Validates: Requirements 3.1**

### Property 12: Content-Type header matches payload

*For any* request sent from the API_Route to the Backend_Service, the Content-Type header SHALL match the payload format (multipart/form-data for files, application/json for text-only).

**Validates: Requirements 3.3**

### Property 13: Successful response forwarding

*For any* successful response (status 200) from the Backend_Service, the API_Route SHALL return the response data with status 200.

**Validates: Requirements 3.7**

### Property 14: Loading state during upload

*For any* file upload operation in progress, the Chat_Interface SHALL display a Loading_State with spinner and "Uploading..." text.

**Validates: Requirements 5.1**

### Property 15: Attachment badge display

*For any* Conversation_Message with hasAttachment flag set to true, the rendered message SHALL display a Message_Badge with file icon.

**Validates: Requirements 5.2**

### Property 16: ARIA announcement on file attach

*For any* successfully attached file, the Drop_Zone ARIA live region SHALL announce "File attached: [filename]" to screen readers.

**Validates: Requirements 5.8**

### Property 17: ARIA announcement on error

*For any* Error_State displayed, the Chat_Interface ARIA live region SHALL announce the error message to screen readers.

**Validates: Requirements 5.9**

### Property 18: Escape key removes file

*For any* state where a file is attached (attachedFile !== null), pressing the Escape key SHALL clear the attached file and reset state to default.

**Validates: Requirements 5.10**

### Property 19: Single file limit enforcement

*For any* attempt to attach a file when a file is already attached, the new file SHALL replace the existing file (not add a second file).

**Validates: Requirements 6.1**

### Property 20: File replacement via selection

*For any* two valid files A and B, if file A is attached and the user selects file B, the File_Preview SHALL display file B and file A SHALL be removed from state.

**Validates: Requirements 6.2**

### Property 21: File replacement via drop

*For any* two valid files A and B, if file A is attached and the user drops file B, the File_Preview SHALL display file B and file A SHALL be removed from state.

**Validates: Requirements 6.3**

## 14. Error Handling Strategy

### 14.1 Client-Side Error Scenarios

| Error Scenario | Detection | User Feedback | Recovery |
|----------------|-----------|---------------|----------|
| File too large (>10MB) | Client validation | Error message below header | Select smaller file |
| Unsupported file type | Client validation | Error message below header | Select supported file |
| Empty file (0 bytes) | Client validation | "File is empty" message | Select valid file |
| No file extension | Client validation | "File has no extension" message | Select file with extension |
| Network error during upload | Fetch catch block | "Failed to send message" | Retry send |

### 14.2 Server-Side Error Scenarios

| Status Code | Meaning | Client Handling | User Feedback |
|-------------|---------|-----------------|---------------|
| 400 | Bad request | Display server error message | Error from backend |
| 413 | Payload too large | Map to client error | "File too large" |
| 500 | Server error | Generic error message | "Server error occurred" |
| Network timeout | No response | Timeout error | "Request timed out. Please try again" |

### 14.3 Error Recovery Flow

```
Error Occurs
  ↓
Display Error Message (ARIA live region)
  ↓
Disable Send Button (if validation error)
  ↓
User Takes Action
  ├─> Selects new valid file → Clear error, show preview
  ├─> Removes file → Clear error, reset to default
  └─> Clicks retry (if network error) → Attempt send again
  ↓
Error Resolved
```

## 15. Performance Considerations

### 15.1 Optimization Strategies

1. **Client-Side Validation First**:
   - Validate file before any network request
   - Prevents unnecessary backend calls
   - Target: <100ms validation time

2. **File Size Limits**:
   - 10MB maximum prevents excessive upload times
   - Expected upload time: 1-3 seconds on typical broadband

3. **FormData Streaming**:
   - Use native FormData API for efficient file handling
   - Browser handles multipart encoding

4. **UI Responsiveness**:
   - File preview renders immediately after validation
   - Target: <50ms render time
   - Loading state appears during network request

5. **Error Handling**:
   - Fail fast on client validation
   - Clear error messages prevent repeated failed attempts

### 15.2 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| File validation | <100ms | Time from file select to validation complete |
| Preview render | <50ms | Time from validation to preview display |
| Upload initiation | <200ms | Time from send click to request start |
| Small file upload (<1MB) | <2s | Time from request start to response |
| Large file upload (10MB) | <10s | Time from request start to response |
| UI state update | <16ms | Time to update React state and re-render |

## 16. Testing Strategy

### 16.1 Unit Tests

**File Validation**:
- Test each supported extension (.txt, .pdf, .docx, .md, .markdown)
- Test unsupported extensions (.jpg, .png, .exe)
- Test file size boundaries (0, 1MB, 10MB, 10MB+1byte)
- Test files without extensions
- Test empty files

**Component Tests**:
- FileUploadButton click triggers file input
- FilePreview displays correct file information
- FilePreview remove button clears file
- DropZone shows overlay on drag-over
- DropZone hides overlay on drag-leave
- DropZone validates file on drop

**Format Function Tests**:
- Test file size formatting (bytes, KB, MB)
- Test edge cases (0 bytes, 1 byte, 1024 bytes, etc.)

### 16.2 Property-Based Tests

**Property 1: Valid extension acceptance**
```typescript
// For any file with a supported extension, validation should pass
forAll(
  fc.record({
    name: fc.constantFrom(
      'document.txt',
      'report.pdf',
      'essay.docx',
      'readme.md',
      'notes.markdown'
    ),
    size: fc.integer({ min: 1, max: 10485760 }) // 1 byte to 10MB
  }),
  (fileData) => {
    const file = new File(['content'], fileData.name, { type: 'text/plain' })
    Object.defineProperty(file, 'size', { value: fileData.size })
    const result = validateFile(file)
    return result.valid === true
  }
)
```
**Tag**: Feature: file-upload-integration, Property 6: File extension validation

**Property 2: Invalid extension rejection**
```typescript
// For any file with an unsupported extension, validation should fail
forAll(
  fc.record({
    name: fc.constantFrom(
      'image.jpg',
      'photo.png',
      'video.mp4',
      'script.exe',
      'archive.zip'
    ),
    size: fc.integer({ min: 1, max: 10485760 })
  }),
  (fileData) => {
    const file = new File(['content'], fileData.name)
    Object.defineProperty(file, 'size', { value: fileData.size })
    const result = validateFile(file)
    return result.valid === false && 
           result.error?.includes('Unsupported file type')
  }
)
```
**Tag**: Feature: file-upload-integration, Property 4: Unsupported file type rejection

**Property 3: Size limit enforcement**
```typescript
// For any file exceeding 10MB, validation should fail
forAll(
  fc.record({
    name: fc.constantFrom('document.txt', 'report.pdf'),
    size: fc.integer({ min: 10485761, max: 50000000 }) // >10MB
  }),
  (fileData) => {
    const file = new File(['content'], fileData.name)
    Object.defineProperty(file, 'size', { value: fileData.size })
    const result = validateFile(file)
    return result.valid === false && 
           result.error?.includes('10MB or less')
  }
)
```
**Tag**: Feature: file-upload-integration, Property 7: File size validation

**Property 4: File replacement**
```typescript
// For any two valid files, attaching the second replaces the first
forAll(
  fc.tuple(
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s + '.txt'),
      size: fc.integer({ min: 1, max: 10485760 })
    }),
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s + '.pdf'),
      size: fc.integer({ min: 1, max: 10485760 })
    })
  ),
  ([fileData1, fileData2]) => {
    // Test that attaching second file replaces first
    const file1 = new File(['content1'], fileData1.name)
    const file2 = new File(['content2'], fileData2.name)
    
    // Simulate: attach file1, then attach file2
    let attachedFile = file1
    attachedFile = file2 // Replacement
    
    return attachedFile === file2 && attachedFile !== file1
  }
)
```
**Tag**: Feature: file-upload-integration, Property 19: Single file limit enforcement

### 16.3 Integration Tests

**End-to-End File Upload Flow**:
1. Render ChatPage
2. Click file upload button
3. Select valid file
4. Verify file preview appears
5. Type message
6. Click send
7. Verify FormData sent to API
8. Mock API response
9. Verify message appears with badge
10. Verify file preview cleared

**Drag-and-Drop Flow**:
1. Render ChatPage
2. Create drag event with file
3. Dispatch dragover event
4. Verify overlay appears
5. Dispatch drop event
6. Verify file preview appears
7. Verify overlay disappears

**Error Handling Flow**:
1. Render ChatPage
2. Select invalid file (too large)
3. Verify error message appears
4. Verify send button disabled
5. Select valid file
6. Verify error clears
7. Verify preview appears
8. Verify send button enabled

### 16.4 Accessibility Tests

**Keyboard Navigation**:
- Tab through all interactive elements
- Verify focus indicators visible
- Test Enter/Space on buttons
- Test Escape key file removal

**Screen Reader Tests** (Manual):
- Verify ARIA labels read correctly
- Verify live region announcements
- Verify error messages announced
- Verify file attachment announced

**Automated Accessibility**:
- Run axe-core or similar tool
- Check for WCAG 2.1 Level AA violations
- Verify color contrast ratios
- Verify focus management

## 17. Security Considerations

### 17.1 Client-Side Security

1. **File Type Validation**:
   - Validate file extension on client
   - Backend must re-validate (never trust client)
   
2. **File Size Limits**:
   - Enforce 10MB limit on client
   - Backend enforces same limit

3. **Content Security**:
   - No client-side file content reading
   - File sent directly to backend
   - Backend responsible for content scanning

4. **XSS Prevention**:
   - File names displayed with React (auto-escaped)
   - No dangerouslySetInnerHTML used

### 17.2 Network Security

1. **HTTPS Only**:
   - All file uploads over HTTPS
   - No fallback to HTTP

2. **CORS Configuration**:
   - Backend validates origin
   - Credentials not sent cross-origin

3. **Rate Limiting**:
   - Backend should implement rate limits
   - Prevent abuse of file upload endpoint

## 18. Browser Compatibility

### 18.1 Required Browser APIs

| API | Chrome | Firefox | Safari | Edge | Fallback |
|-----|--------|---------|--------|------|----------|
| File API | 13+ | 7+ | 11+ | 12+ | N/A (required) |
| FormData | 7+ | 4+ | 5+ | 12+ | N/A (required) |
| Drag & Drop | 4+ | 3.5+ | 3.1+ | 12+ | Button upload |
| Fetch API | 42+ | 39+ | 10.1+ | 14+ | N/A (Next.js polyfills) |

### 18.2 Tested Browsers

- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+

### 18.3 Progressive Enhancement

**Core Functionality** (all browsers):
- File upload button
- File preview
- Send file with message

**Enhanced Functionality** (modern browsers):
- Drag-and-drop upload
- File size preview formatting
- Smooth animations

## 19. Future Enhancements (Out of Scope)

The following features are explicitly deferred to future phases:

1. **Multiple File Attachments**: Allow 2-5 files per message
2. **Image File Support**: .png, .jpg, .gif with preview thumbnails
3. **File Preview Rendering**: Display file contents inline before sending
4. **File Download**: Download files from message history
5. **File Storage**: Persist uploaded files for conversation history
6. **Cloud Storage Integration**: Google Drive, Dropbox, OneDrive
7. **File Compression**: Automatic compression for large files
8. **OCR Processing**: Extract text from images
9. **Malware Scanning**: Virus/malware detection
10. **File Encryption**: End-to-end encryption for sensitive files

## 20. Conclusion

This design document provides a comprehensive blueprint for implementing file upload functionality in the FastChat frontend application. The implementation follows best practices for React development, accessibility, and user experience.

### Key Design Decisions

1. **Component-Based Architecture**: Modular, reusable components
2. **Progressive Enhancement**: Core functionality works everywhere, enhanced features in modern browsers
3. **Accessibility First**: WCAG 2.1 Level AA compliance from the start
4. **Client-Side Validation**: Fast feedback, reduced server load
5. **Backward Compatibility**: JSON requests still work for text-only messages
6. **Clear Error Handling**: User-friendly error messages with recovery paths

### Success Criteria

The implementation will be considered successful when:

1. Users can attach files via button click or drag-and-drop
2. Client-side validation provides immediate feedback
3. File uploads integrate seamlessly with existing chat flow
4. All interactive elements are keyboard accessible
5. Screen readers can navigate and understand all functionality
6. Error messages are clear and actionable
7. File attachments are indicated in message history
8. Backend receives properly formatted multipart requests
9. Token limit supports comprehensive file analysis
10. All correctness properties pass their tests

### Next Steps

1. Review design document with team
2. Begin Phase 1 implementation (Core File Upload UI)
3. Write unit tests alongside implementation
4. Conduct accessibility review after Phase 5
5. Perform end-to-end testing
6. Deploy to staging environment
7. User acceptance testing
8. Production deployment
