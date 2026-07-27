"use client"

import { useCallback } from "react"
import { Upload } from "lucide-react"
import type { DropZoneProps } from "./file-upload-types"

export function DropZone({ onFileDrop, disabled = false, isDragOver, onDragOverChange, children }: DropZoneProps) {
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        onDragOverChange(true)
      }
    },
    [disabled, onDragOverChange],
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      onDragOverChange(false)
    },
    [onDragOverChange],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      onDragOverChange(false)

      if (disabled) return

      const file = e.dataTransfer.files?.[0]
      if (file) {
        onFileDrop(file)
      }
    },
    [disabled, onFileDrop, onDragOverChange],
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      {children}

      {/* Drag-over overlay */}
      {isDragOver && !disabled && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/5">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">Drop file here</span>
          </div>
        </div>
      )}
    </div>
  )
}