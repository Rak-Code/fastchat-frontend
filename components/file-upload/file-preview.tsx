"use client"

import { Button } from "@/components/ui/button"
import { FileText, X } from "lucide-react"
import { formatFileSize } from "./file-validation"
import type { FilePreviewProps } from "./file-upload-types"

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const truncatedName = file.name.length > 40 ? file.name.substring(0, 37) + "..." : file.name

  return (
    <div
      className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm"
      role="status"
      aria-live="polite"
      aria-label={`File attached: ${file.name}`}
    >
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate" title={file.name}>
        {truncatedName}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label="Remove attached file"
        className="h-6 w-6 shrink-0 rounded-full"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}