export type FileType = 'image' | 'video' | 'ar_recording';
export type MediaStatus = 'uploaded' | 'processing' | 'validated' | 'failed';

export interface MediaFile {
  id: string;
  projectId: string;
  fileType: FileType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  resolution?: {
    width: number;
    height: number;
  };
  duration?: number;
  status: MediaStatus;
  uploadedAt: string;
  errorMessage?: string;
}

export interface UploadProgressEvent {
  fileId: string;
  uploadedBytes: number;
  totalBytes: number;
  progressPercentage: number;
}

export interface UploadRequest {
  file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  };
  fileType: FileType;
  projectId: string;
}

export interface ValidateMediaRequest {
  projectId: string;
}

export interface ValidateMediaResponse {
  isValid: boolean;
  issues: {
    type: 'warning' | 'error';
    code: string;
    message: string;
  }[];
}
