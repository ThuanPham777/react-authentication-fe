import React, { useRef, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileIcon } from 'lucide-react';

/**
 * Represents a file attachment with name, size, and file object
 */
export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

/**
 * Formats file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface AttachmentUploaderProps {
  /**
   * Current list of attachments
   */
  attachments: AttachmentFile[];
  /**
   * Callback when attachments change (add/remove)
   */
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
  /**
   * Whether the uploader is disabled
   */
  disabled?: boolean;
  /**
   * Maximum file size in bytes (default: 25MB)
   */
  maxFileSize?: number;
  /**
   * Maximum number of attachments (default: 10)
   */
  maxAttachments?: number;
  /**
   * Compact mode for inline editors (e.g., reply)
   */
  compact?: boolean;
}

/**
 * AttachmentUploader - Reusable component for handling file attachments
 *
 * Features:
 * - File selection via button click
 * - Drag and drop support
 * - File size validation
 * - Attachment limit validation
 * - Remove individual attachments
 * - Compact mode for inline editors
 *
 * @param attachments - Current list of attachments
 * @param onAttachmentsChange - Callback when attachments change
 * @param disabled - Whether the uploader is disabled
 * @param maxFileSize - Maximum file size in bytes (default: 25MB)
 * @param maxAttachments - Maximum number of attachments (default: 10)
 * @param compact - Compact mode for inline editors
 */
export function AttachmentUploader({
  attachments,
  onAttachmentsChange,
  disabled = false,
  maxFileSize = 25 * 1024 * 1024, // 25MB default
  maxAttachments = 10,
  compact = false,
}: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId();

  /**
   * Handles file selection from input or drag-drop
   */
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentFile[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Check max attachments limit
      if (attachments.length + newAttachments.length >= maxAttachments) {
        errors.push(`Maximum ${maxAttachments} attachments allowed`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(
          `${file.name} exceeds maximum file size of ${formatFileSize(maxFileSize)}`,
        );
        return;
      }

      // Check for duplicate files
      const isDuplicate = attachments.some(
        (att) => att.name === file.name && att.size === file.size,
      );
      if (isDuplicate) {
        errors.push(`${file.name} is already attached`);
        return;
      }

      newAttachments.push({
        id: `${uniqueId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        file,
      });
    });

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }

    // Show errors if any (using alert for simplicity, could be improved)
    if (errors.length > 0) {
      console.warn('Attachment errors:', errors);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Removes an attachment by ID
   */
  const handleRemoveAttachment = (attachmentId: string) => {
    onAttachmentsChange(attachments.filter((att) => att.id !== attachmentId));
  };

  /**
   * Opens file picker dialog
   */
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles drag over event
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Handles file drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div
      className={compact ? 'space-y-2' : 'space-y-3'}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        multiple
        className='hidden'
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
      />

      {/* Attachment button */}
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size={compact ? 'sm' : 'default'}
          onClick={handleButtonClick}
          disabled={disabled || attachments.length >= maxAttachments}
          className='gap-2'
        >
          <Paperclip className='h-4 w-4' />
          {compact ? 'Attach' : 'Attach files'}
        </Button>
        {!compact && (
          <span className='text-xs text-muted-foreground'>
            Max {formatFileSize(maxFileSize)} per file, up to {maxAttachments}{' '}
            files
          </span>
        )}
      </div>

      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className={compact ? 'flex flex-wrap gap-2' : 'space-y-2'}>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={
                compact
                  ? 'flex items-center gap-1 rounded border bg-muted/50 px-2 py-1 text-xs'
                  : 'flex items-center justify-between rounded border bg-muted/50 px-3 py-2 text-sm'
              }
            >
              <div className='flex items-center gap-2 min-w-0'>
                <FileIcon
                  className={compact ? 'h-3 w-3 shrink-0' : 'h-4 w-4 shrink-0'}
                />
                <span
                  className='truncate'
                  title={attachment.name}
                >
                  {attachment.name}
                </span>
                {!compact && (
                  <span className='text-muted-foreground shrink-0'>
                    ({formatFileSize(attachment.size)})
                  </span>
                )}
              </div>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className={compact ? 'h-5 w-5 p-0' : 'h-6 w-6 p-0'}
                onClick={() => handleRemoveAttachment(attachment.id)}
                disabled={disabled}
              >
                <X className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                <span className='sr-only'>Remove {attachment.name}</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
