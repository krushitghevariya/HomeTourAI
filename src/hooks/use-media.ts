import { useCallback, useState } from 'react';
import { mediaService } from '../api/services/media.service';
import { useAsyncAction } from './use-async-action';
import type {
  MediaFile,
  UploadRequest,
  ValidateMediaResponse,
} from '../api/types';

export const useMedia = (projectId: string) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const uploadAction = useAsyncAction<MediaFile>();
  const listAction = useAsyncAction<MediaFile[]>();
  const deleteAction = useAsyncAction<void>();
  const validateAction = useAsyncAction<ValidateMediaResponse>();

  const fetchMedia = useCallback(async () => {
    return await listAction.execute(async () => {
      const media = await mediaService.getProjectMedia(projectId);
      setMediaFiles(media);
      return media;
    });
  }, [projectId, listAction]);

  const uploadMedia = useCallback(
    async (request: UploadRequest) => {
      const fileId = request.file.name;

      return await uploadAction.execute(async () => {
        return await mediaService.uploadMedia(request, (progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            [fileId]: progress,
          }));
        });
      });
    },
    [uploadAction]
  );

  const deleteMedia = useCallback(
    async (mediaId: string) => {
      await deleteAction.execute(async () => {
        await mediaService.deleteMediaFile(projectId, mediaId);
        setMediaFiles((prev) => prev.filter((m) => m.id !== mediaId));
      });
    },
    [projectId, deleteAction]
  );

  const validateMedia = useCallback(async () => {
    return await validateAction.execute(async () => {
      return await mediaService.validateMedia({ projectId });
    });
  }, [projectId, validateAction]);

  const getUploadProgress = useCallback((fileId: string): number => {
    return uploadProgress[fileId] || 0;
  }, [uploadProgress]);

  return {
    mediaFiles,
    uploadProgress,
    loading: listAction.loading,
    error: listAction.errorMessage,
    fetchMedia,
    uploadMedia: {
      execute: uploadMedia,
      loading: uploadAction.loading,
      error: uploadAction.errorMessage,
    },
    deleteMedia: {
      execute: deleteMedia,
      loading: deleteAction.loading,
      error: deleteAction.errorMessage,
    },
    validateMedia: {
      execute: validateMedia,
      loading: validateAction.loading,
      error: validateAction.errorMessage,
    },
    getUploadProgress,
  };
};
