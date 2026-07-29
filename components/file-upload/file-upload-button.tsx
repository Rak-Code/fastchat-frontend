"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip } from "lucide-react"
import { SUPPORTED_MIME_TYPES } from "./file-upload-types"
import type { FileUploadButtonProps } from "./file-upload-types"

export function FileUploadButton({ onFileSelect, disabled = false }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
    // Reset input so the same file can be re-selected
    e.target.value = ""
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_MIME_TYPES.join(",")}
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
        suppressHydrationWarning={true}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled}
        aria-label="Attach file"
        className="h-12 w-12 shrink-0 rounded-full"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
    </>
  )
}