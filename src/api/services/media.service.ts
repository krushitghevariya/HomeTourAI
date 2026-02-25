import { getHttpClient } from '../client/api-instance';
import {
  validateFileSize,
  validateFileType,
  validateImageDimensions,
  validateVideoDuration,
} from '../middleware/validation';
import { ValidationError, NotFoundError } from '../errors';
import type {
  MediaFile,
  UploadRequest,
  ValidateMediaRequest,
  ValidateMediaResponse,
} from '../types';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_IMAGE_SIZE_MB = 50;
const MAX_VIDEO_SIZE_MB = 500;
const MIN_IMAGE_DIMENSION = 320;

export class MediaService {
  async uploadMedia(
    request: UploadRequest,
    onProgress?: (progress: number) => void
  ): Promise<MediaFile> {
    this.validateUploadRequest(request);

    const file = new File([request.file.uri], request.file.name, {
      type: request.file.type,
    });

    return getHttpClient().uploadFile<MediaFile>(
      `/projects/${request.projectId}/upload`,
      file,
      { fileType: request.fileType },
      onProgress
    );
  }

  async getProjectMedia(projectId: string): Promise<MediaFile[]> {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    return getHttpClient().get<MediaFile[]>(
      `/projects/${projectId}/media`,
      { timeout: 15000 }
    );
  }

  async deleteMediaFile(projectId: string, mediaId: string): Promise<void> {
    if (!projectId?.trim() || !mediaId?.trim()) {
      throw new ValidationError('Project ID and Media ID are required');
    }

    await getHttpClient().delete(
      `/projects/${projectId}/media/${mediaId}`
    );
  }

  async validateMedia(
    request: ValidateMediaRequest
  ): Promise<ValidateMediaResponse> {
    if (!request.projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    return getHttpClient().post<ValidateMediaResponse>(
      `/projects/${request.projectId}/validate`,
      request,
      { timeout: 30000 }
    );
  }

  async getMediaMetadata(
    projectId: string,
    mediaId: string
  ): Promise<MediaFile> {
    if (!projectId?.trim() || !mediaId?.trim()) {
      throw new ValidationError('Project ID and Media ID are required');
    }

    const response = await getHttpClient().get<MediaFile>(
      `/projects/${projectId}/media/${mediaId}`
    );

    if (!response) {
      throw new NotFoundError('Media file');
    }

    return response;
  }

  private validateUploadRequest(request: UploadRequest): void {
    const { file, fileType, projectId } = request;

    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    if (!file) {
      throw new ValidationError('File is required');
    }

    if (!file.name?.trim()) {
      throw new ValidationError('File name is required');
    }

    if (!fileType) {
      throw new ValidationError('File type is required');
    }

    if (fileType === 'image') {
      this.validateImageUpload(file);
    } else if (fileType === 'video') {
      this.validateVideoUpload(file);
    } else if (fileType === 'ar_recording') {
      this.validateVideoUpload(file);
    }
  }

  private validateImageUpload(file: File): void {
    validateFileType(file.name, file.type, ALLOWED_IMAGE_TYPES);
    validateFileSize(file.size, MAX_IMAGE_SIZE_MB);
  }

  private validateVideoUpload(file: File): void {
    validateFileType(file.name, file.type, ALLOWED_VIDEO_TYPES);
    validateFileSize(file.size, MAX_VIDEO_SIZE_MB);
  }
}

export const mediaService = new MediaService();
