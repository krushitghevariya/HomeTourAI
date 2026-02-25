import { useCallback, useState, useRef } from 'react';
import { jobService } from '../api/services/job.service';
import { useAsyncAction } from './use-async-action';
import type { ProcessingJob, StartGenerationRequest } from '../api/types';

export const useGeneration = () => {
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const startAction = useAsyncAction<ProcessingJob>();
  const cancelAction = useAsyncAction<void>();

  const startGeneration = useCallback(
    async (request: StartGenerationRequest) => {
      return await startAction.execute(async () => {
        const response = await jobService.startGeneration(request);
        setCurrentJob(response.job);

        unsubscribeRef.current = jobService.pollJobStatus(
          request.projectId,
          (job) => {
            setCurrentJob(job);
          },
          (job) => {
            setCurrentJob(job);
          },
          (error) => {
            console.error('Job polling error:', error);
          }
        );

        return response.job;
      });
    },
    [startAction]
  );

  const cancelGeneration = useCallback(async () => {
    if (!currentJob?.id) return;

    await cancelAction.execute(async () => {
      await jobService.cancelJob(currentJob.id);
      setCurrentJob(null);
    });
  }, [currentJob?.id, cancelAction]);

  const stopPolling = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  const resetJob = useCallback(() => {
    stopPolling();
    setCurrentJob(null);
  }, [stopPolling]);

  return {
    currentJob,
    jobProgress: currentJob?.progressPercentage || 0,
    jobStatus: currentJob?.status || 'idle',
    loading: startAction.loading,
    error: startAction.errorMessage,
    startGeneration: {
      execute: startGeneration,
      loading: startAction.loading,
      error: startAction.errorMessage,
    },
    cancelGeneration: {
      execute: cancelGeneration,
      loading: cancelAction.loading,
      error: cancelAction.errorMessage,
    },
    stopPolling,
    resetJob,
  };
};
