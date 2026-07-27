# Implementation Plan: Frontend File Upload Integration

## Overview

This implementation plan breaks down the file upload integration feature into discrete, testable coding tasks. The feature enables users to attach text-based files (.txt, .pdf, .docx, .md, .markdown) to chat messages via a paperclip button or drag-and-drop interface.

The implementation follows a 6-phase approach:
1. Core File Upload UI components
2. Drag-and-Drop support
3. API Route enhancements for multipart/form-data
4. Message sending logic with file attachments
5. Accessibility enhancements (ARIA, keyboard navigation)
6. Backend token configuration updates

## Tasks

- [ ] 1. Set up project structure and validation utilities
  - Create `components/file-upload/` directory
  - Create file validation utility function with constants (MAX_FILE_SIZE, SUPPORTED_EXTENSIONS)
  - Export TypeScript interfaces for FileUploadButtonProps, FilePreviewProps, DropZoneProps
  - _Requirements: 1.7, 1.8, 2.1, 2.2_

- [ ] 2. Implement Core File Upload UI Components
  - [ ] 2.1 Implement FileUploadButton component
    - Create FileUploadButton.tsx with paperclip icon from lucide-react
    - Implement hidden file input with accept attribute for supported formats
    - Add click handler to trigger native file picker
    - Add ARIA label "Attach file" for accessibility
    - Style with shadcn/ui Button component (ghost variant, icon size)
    - _Requirements: 1.1, 1.2, 5.5, 5.6_

  - [ ] 2.2 Implement FilePreview component
    - Create FilePreview.tsx with file icon and remove button
    - Display filename (truncated if too long) and formatted file size
    - Implement formatFileSize helper function (Bytes, KB, MB)
    - Add remove button with X icon and ARIA label "Remove attached file"
    - Style with rounded border, muted background, proper spacing
    - Add ARIA live region for screen reader announcements
    - _Requirements: 1.5, 1.6, 5.7, 5.8_

  - [ ]* 2.3 Write property test for file size formatting
    - **Property: File size formatting consistency**
    - **Validates: Requirements 1.5**
    - Test formatFileSize function with various byte values (0, 1, 1024, 1048576, 10485760)
    - Verify correct units (Bytes, KB, MB) and precision (2 decimal places)

- [ ] 3. Integrate file upload into ChatPage component
  - [ ] 3.1 Add file upload state management to app/page.tsx
    - Add state variables: attachedFile, fileError, isDragOver, isLoading
    - Implement handleFileSelect function with validation
    - Implement handleFileRemove function
    - Add useEffect hook for Escape key handler to remove file
    - _Requirements: 1.10, 2.4, 5.10_

  - [ ] 3.2 Integrate FileUploadButton and FilePreview into input area
    - Position FileUploadButton left of textarea, same height as send button
    - Conditionally render FilePreview above textarea when file attached
    - Display fileError message below header when validation fails
    - Update input area layout to accommodate new components
    - _Requirements: 1.1, 1.5, 1.9, 2.3_

  - [ ]* 3.3 Write property test for validation logic
    - **Property 6: File extension validation**
    - **Validates: Requirements 2.1**
    - Generate files with supported extensions (.txt, .pdf, .docx, .md, .markdown)
    - Verify validation returns valid: true for all supported formats
    - **Property 7: File size validation**
    - **Validates: Requirements 2.2**
    - Generate files with sizes from 1 byte to 10MB
    - Verify validation returns valid: true for sizes within limit
    - Generate files exceeding 10MB
    - Verify validation returns valid: false with correct error message

  - [ ]* 3.4 Write property test for unsupported file rejection
    - **Property 4: Unsupported file type rejection**
    - **Validates: Requirements 1.8, 2.1**
    - Generate files with unsupported extensions (.jpg, .png, .mp4, .exe, .zip)
    - Verify validation returns valid: false
    - Verify error message is "Unsupported file type. Please upload .txt, .pdf, .docx, .md, or .markdown files"

- [ ] 4. Checkpoint - Ensure core file upload UI works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Drag-and-Drop Support
  - [ ] 5.1 Implement DropZone component
    - Create DropZone.tsx with drag event handlers (dragOver, dragLeave, drop)
    - Implement drag-over visual feedback (blue overlay, dashed border, upload icon)
    - Add drop handler with file validation against accept prop
    - Wrap children with drag-and-drop functionality
    - Handle disabled state appropriately
    - _Requirements: 1.3, 1.4_

  - [ ] 5.2 Wrap ChatPage input area with DropZone
    - Wrap the input section (FileUploadButton + textarea + send button) with DropZone
    - Pass handleFileSelect as onFileDrop callback
    - Test drag-over state updates isDragOver correctly
    - _Requirements: 1.3, 1.4_

  - [ ]* 5.3 Write property test for drag-and-drop behavior
    - **Property 1: Drag-over state visibility**
    - **Validates: Requirements 1.3**
    - Simulate dragover event on DropZone
    - Verify drop zone overlay becomes visible
    - **Property 2: Valid file drop triggers preview**
    - **Validates: Requirements 1.4, 1.5**
    - Generate valid files and simulate drop events
    - Verify FilePreview displays with correct filename and size

- [ ] 6. Update API Route for File Uploads
  - [ ] 6.1 Enhance app/api/chat/route.ts to handle multipart/form-data
    - Detect Content-Type header (multipart/form-data vs application/json)
    - Parse FormData when Content-Type is multipart/form-data
    - Extract conversationId, message, and file from FormData
    - Validate required fields (conversationId, message)
    - Validate file size does not exceed MAX_FILE_SIZE (10MB)
    - Construct FormData payload for backend with all three fields
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 6.2 Implement error mapping for backend responses
    - Map HTTP 413 to "File too large" error response
    - Map HTTP 400 to error message from backend
    - Map HTTP 500 to "Server error occurred"
    - Return status 200 with response data on success
    - Add hasAttachment flag to response based on file presence
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

  - [ ] 6.3 Maintain backward compatibility for JSON requests
    - Keep existing JSON request handling for text-only messages
    - Ensure JSON requests forward to backend with application/json Content-Type
    - Add hasAttachment: false flag to JSON response
    - Test both request formats work correctly
    - _Requirements: 3.2, 3.3_

  - [ ]* 6.4 Write property test for API route behavior
    - **Property 11: FormData construction completeness**
    - **Validates: Requirements 3.1**
    - Generate various FormData payloads with conversationId, message, file
    - Verify all three fields present in constructed FormData
    - **Property 12: Content-Type header matches payload**
    - **Validates: Requirements 3.3**
    - Test multipart requests include multipart/form-data Content-Type
    - Test JSON requests include application/json Content-Type
    - **Property 13: Successful response forwarding**
    - **Validates: Requirements 3.7**
    - Mock successful backend responses
    - Verify API route returns status 200 with response data

- [ ] 7. Checkpoint - Ensure API route handles files correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Enhance Message Sending Logic
  - [ ] 8.1 Update handleSend function to support file attachments
    - Check if attachedFile exists before sending
    - Create FormData with conversationId, message, and file when file attached
    - Use JSON request body when no file attached (backward compatibility)
    - Add hasAttachment flag to user message in state
    - Set isLoading state during upload
    - _Requirements: 1.10, 5.1_

  - [ ] 8.2 Implement file cleanup after successful send
    - Clear attachedFile state after successful message send
    - Clear fileError state after successful send
    - Remove user message from state if request fails
    - Restore input value if request fails for retry
    - Focus textarea after send completes
    - _Requirements: 1.10_

  - [ ] 8.3 Add visual indicator for messages with attachments
    - Display Message_Badge with paperclip icon for messages where hasAttachment is true
    - Position badge next to message timestamp
    - Style with small file icon and "File attached" text
    - _Requirements: 5.2_

  - [ ]* 8.4 Write property test for message sending flow
    - **Property 5: Successful send clears file preview**
    - **Validates: Requirements 1.10**
    - Simulate sending message with attached file
    - Mock successful API response
    - Verify attachedFile state is null after send
    - Verify FilePreview no longer renders
    - **Property 15: Attachment badge display**
    - **Validates: Requirements 5.2**
    - Render messages with hasAttachment: true
    - Verify Message_Badge displays with file icon

- [ ] 9. Implement Accessibility Features
  - [ ] 9.1 Add comprehensive ARIA labels and roles
    - Verify FileUploadButton has aria-label="Attach file"
    - Verify FilePreview has role="status" and aria-live="polite"
    - Verify FilePreview remove button has aria-label="Remove attached file"
    - Add aria-label to FilePreview with "File attached: [filename]"
    - _Requirements: 5.6, 5.7, 5.8_

  - [ ] 9.2 Implement ARIA live regions for state announcements
    - Add aria-live="assertive" to error message container
    - Add aria-live="polite" to loading state indicator
    - Ensure error messages announced when fileError state changes
    - Ensure "Uploading..." announced during isLoading state
    - _Requirements: 5.9_

  - [ ] 9.3 Add keyboard navigation support
    - Verify Tab key navigates through FileUploadButton, textarea, send button, remove button
    - Add visible focus indicators (ring outline) for all interactive elements
    - Verify Enter/Space keys trigger file picker on FileUploadButton
    - Verify Escape key handler clears attachedFile (already implemented in 3.1)
    - Test keyboard navigation flow end-to-end
    - _Requirements: 5.4, 5.5, 5.10_

  - [ ]* 9.4 Write property test for accessibility features
    - **Property 16: ARIA announcement on file attach**
    - **Validates: Requirements 5.8**
    - Simulate file attachment
    - Verify ARIA live region announces "File attached: [filename]"
    - **Property 17: ARIA announcement on error**
    - **Validates: Requirements 5.9**
    - Trigger validation error
    - Verify ARIA live region announces error message
    - **Property 18: Escape key removes file**
    - **Validates: Requirements 5.10**
    - Attach file, then simulate Escape key press
    - Verify attachedFile state becomes null

- [ ] 10. Implement Multiple File Handling Logic
  - [ ] 10.1 Add file replacement logic
    - When file already attached and new file selected, replace existing file
    - When file already attached and new file dropped, replace existing file
    - Update FilePreview to show new file information
    - Maintain single file limit (no arrays)
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 10.2 Write property test for file replacement
    - **Property 19: Single file limit enforcement**
    - **Validates: Requirements 6.1**
    - Attach file A, then attach file B
    - Verify only file B remains in state
    - **Property 20: File replacement via selection**
    - **Validates: Requirements 6.2**
    - Generate two valid files with different names
    - Attach first file, verify preview shows file 1
    - Attach second file, verify preview shows file 2
    - **Property 21: File replacement via drop**
    - **Validates: Requirements 6.3**
    - Attach file via button, then drop different file
    - Verify new file replaces old file in preview

- [ ] 11. Checkpoint - Ensure all frontend features work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Update Backend Configuration
  - [ ] 12.1 Update application.yml in backend repository
    - Navigate to backend repository src/main/resources/application.yml
    - Change spring.ai.groq.chat.options.max-tokens from 3000 to 7000
    - Add comment explaining token allocation (file context: 1250, message: 1000, system: 100, history: 500-1000, response: 7000)
    - Verify spring.servlet.multipart.max-file-size is set to 10MB
    - Verify spring.servlet.multipart.max-request-size is set to 11MB
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 13. Add Loading State Indicators
  - [ ] 13.1 Implement loading state during file upload
    - Display spinner with "Uploading..." text when isLoading is true
    - Position loading indicator below file preview or in input area
    - Use Loader2 icon from lucide-react with animate-spin
    - _Requirements: 5.1_

  - [ ]* 13.2 Write property test for loading state
    - **Property 14: Loading state during upload**
    - **Validates: Requirements 5.1**
    - Set isLoading to true
    - Verify Loading_State displays with spinner and "Uploading..." text

- [ ] 14. Add Error State Handling
  - [ ] 14.1 Implement comprehensive error display
    - Display fileError message in red text below header/above preview
    - Add role="alert" and aria-live="assertive" to error container
    - Style error message with text-destructive class
    - Clear error when valid file selected
    - _Requirements: 1.7, 1.8, 2.3, 5.9_

  - [ ]* 14.2 Write property test for error state behavior
    - **Property 8: Validation failure prevents preview**
    - **Validates: Requirements 2.3**
    - Generate invalid files (wrong type, too large)
    - Trigger validation
    - Verify error state is set
    - Verify FilePreview does not render
    - **Property 9: Error state blocks submission**
    - **Validates: Requirements 2.4**
    - Set fileError to non-null value
    - Verify send button is disabled or submission is prevented
    - **Property 10: Valid file clears error state**
    - **Validates: Requirements 2.5**
    - Set fileError to error message
    - Attach valid file
    - Verify fileError becomes null
    - Verify FilePreview renders

- [ ] 15. Implement Responsive Design
  - [ ] 15.1 Add responsive styling for different viewport sizes
    - Mobile (320px-640px): 36x36px buttons, full-width preview
    - Tablet (641px-1024px): 40x40px buttons, max-width 600px preview
    - Desktop (1025px+): 40x40px paperclip, 48x48px send, max-width 600px preview
    - Test layouts at breakpoints: 320px, 640px, 1024px, 2560px
    - _Requirements: 5.3_

- [ ] 16. Final Checkpoint - Complete integration testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability (e.g., _Requirements: 1.1, 1.2_)
- Checkpoints ensure incremental validation at reasonable breaks
- Property tests validate universal correctness properties from the design document
- The backend configuration update (task 12) requires access to the backend repository
- All components use TypeScript with strict type checking
- Styling follows Tailwind CSS 4 conventions with shadcn/ui components
- Icons are sourced from lucide-react package
- File validation happens client-side first, then backend re-validates
- FormData construction is handled by native browser APIs
- ARIA attributes and keyboard navigation ensure WCAG 2.1 Level AA compliance

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "5.1"] },
    { "id": 4, "tasks": ["3.3", "3.4", "5.2"] },
    { "id": 5, "tasks": ["5.3", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3"] },
    { "id": 7, "tasks": ["6.4", "8.1", "13.1"] },
    { "id": 8, "tasks": ["8.2", "8.3", "12.1"] },
    { "id": 9, "tasks": ["8.4", "9.1", "13.2"] },
    { "id": 10, "tasks": ["9.2", "9.3", "10.1", "14.1"] },
    { "id": 11, "tasks": ["9.4", "10.2", "14.2"] },
    { "id": 12, "tasks": ["15.1"] }
  ]
}
```
