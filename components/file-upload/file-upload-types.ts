import type React from "react"

export interface FileUploadButtonProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export interface FilePreviewProps {
  file: File
  onRemove: () => void
}

export interface DropZoneProps {
  onFileDrop: (file: File) => void
  disabled?: boolean
  isDragOver: boolean
  onDragOverChange: (isDragOver: boolean) => void
  children: React.ReactNode
}

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export const SUPPORTED_EXTENSIONS = [".txt", ".text", ".md", ".markdown", ".pdf", ".docx"] as const

export const SUPPORTED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const