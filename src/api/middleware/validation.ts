import { ValidationError } from '../errors';

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validatePassword = (password: string): void => {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters', {
      field: 'password',
      minLength: 8,
    });
  }
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter', {
      field: 'password',
    });
  }
  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one number', {
      field: 'password',
    });
  }
};

export const validateProjectName = (name: string): void => {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Project name cannot be empty', { field: 'name' });
  }
  if (name.length > 100) {
    throw new ValidationError('Project name cannot exceed 100 characters', { field: 'name' });
  }
};

export const validateFileSize = (sizeBytes: number, maxMB: number): void => {
  const maxBytes = maxMB * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    throw new ValidationError(`File size cannot exceed ${maxMB}MB`, {
      field: 'fileSize',
      maxBytes,
      actualBytes: sizeBytes,
    });
  }
};

export const validateFileType = (
  fileName: string,
  mimeType: string,
  allowedTypes: string[]
): void => {
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const isValidMime = allowedTypes.some(
    (type) => mimeType.includes(type) || type.includes(fileExtension)
  );

  if (!isValidMime) {
    throw new ValidationError('File type not supported', {
      field: 'fileType',
      fileName,
      mimeType,
      allowed: allowedTypes,
    });
  }
};

export const validateImageDimensions = (
  width: number,
  height: number,
  minWidth = 320,
  minHeight = 240
): void => {
  if (width < minWidth || height < minHeight) {
    throw new ValidationError(
      `Image dimensions must be at least ${minWidth}x${minHeight}`,
      {
        field: 'resolution',
        actual: { width, height },
        minimum: { width: minWidth, height: minHeight },
      }
    );
  }
};

export const validateVideoDuration = (durationSeconds: number, minSeconds = 5): void => {
  if (durationSeconds < minSeconds) {
    throw new ValidationError(`Video must be at least ${minSeconds} seconds`, {
      field: 'duration',
      actual: durationSeconds,
      minimum: minSeconds,
    });
  }
};
