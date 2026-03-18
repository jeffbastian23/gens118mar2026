/**
 * File validation utility for upload size limits
 * Max file size: 600KB
 */

import { toast } from "sonner";

export const MAX_FILE_SIZE_KB = 600;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;

export interface FileValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates file size against the maximum allowed size (600KB)
 * @param file - The file to validate
 * @param customMaxSizeKB - Optional custom max size in KB (default: 600KB)
 * @returns FileValidationResult with valid status and optional error message
 */
export const validateFileSize = (
  file: File,
  customMaxSizeKB: number = MAX_FILE_SIZE_KB
): FileValidationResult => {
  const maxBytes = customMaxSizeKB * 1024;
  
  if (file.size > maxBytes) {
    const fileSizeKB = (file.size / 1024).toFixed(2);
    return {
      valid: false,
      message: `Ukuran file "${file.name}" (${fileSizeKB} KB) melebihi batas maksimal ${customMaxSizeKB} KB. Silakan kompres atau pilih file yang lebih kecil.`
    };
  }
  
  return { valid: true };
};

/**
 * Validates file size and shows toast error if invalid
 * @param file - The file to validate
 * @param customMaxSizeKB - Optional custom max size in KB (default: 600KB)
 * @returns boolean - true if valid, false if invalid
 */
export const validateFileSizeWithToast = (
  file: File,
  customMaxSizeKB: number = MAX_FILE_SIZE_KB
): boolean => {
  const result = validateFileSize(file, customMaxSizeKB);
  
  if (!result.valid && result.message) {
    toast.error(result.message);
  }
  
  return result.valid;
};

/**
 * Validates multiple files and returns only valid ones
 * @param files - Array of files or FileList to validate
 * @param customMaxSizeKB - Optional custom max size in KB (default: 600KB)
 * @returns Array of valid files
 */
export const filterValidFiles = (
  files: File[] | FileList,
  customMaxSizeKB: number = MAX_FILE_SIZE_KB
): File[] => {
  const fileArray = Array.from(files);
  const validFiles: File[] = [];
  const invalidFiles: string[] = [];
  
  fileArray.forEach((file) => {
    const result = validateFileSize(file, customMaxSizeKB);
    if (result.valid) {
      validFiles.push(file);
    } else {
      invalidFiles.push(file.name);
    }
  });
  
  if (invalidFiles.length > 0) {
    toast.error(
      `File berikut melebihi batas ${customMaxSizeKB} KB: ${invalidFiles.join(", ")}`
    );
  }
  
  return validFiles;
};

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "450 KB" or "1.2 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
};
