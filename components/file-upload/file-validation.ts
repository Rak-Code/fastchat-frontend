import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS } from "./file-upload-types"
import type { FileValidationResult } from "./file-upload-types"

/**
 * Validates a file for upload based on type and size constraints.
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 10 MB limit (${formatFileSize(file.size)}). Please upload a smaller file.`,
    }
  }

  // Check file extension
  const filename = file.name.toLowerCase()
  const hasSupportedExtension = SUPPORTED_EXTENSIONS.some((ext) => filename.endsWith(ext))

  if (!hasSupportedExtension) {
    return {
      valid: false,
      error:
        "Unsupported file type. Please upload .txt, .pdf, .docx, .md, or .markdown files",
    }
  }

  return { valid: true }
}

/**
 * Formats a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  if (bytes < 1024) return `${bytes} Bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}