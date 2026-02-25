import { getHttpClient } from '../client/api-instance';
import { ValidationError, NotFoundError } from '../errors';
import type {
  ProcessingJob,
  StartGenerationRequest,
  StartGenerationResponse,
  JobStatusResponse,
} from '../types';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_DURATION_MS = 3600000;

export class JobService {
  async startGeneration(
    request: StartGenerationRequest
  ): Promise<StartGenerationResponse> {
    if (!request.projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    if (!request.generationType) {
      throw new ValidationError('Generation type is required', {
        field: 'generationType',
        allowed: ['tour_360', 'ar_preview'],
      });
    }

    return getHttpClient().post<StartGenerationResponse>(
      `/projects/${request.projectId}/generate`,
      request,
      { timeout: 15000 }
    );
  }

  async getJobStatus(projectId: string): Promise<JobStatusResponse> {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    const response = await getHttpClient().get<JobStatusResponse>(
      `/projects/${projectId}/status`,
      { timeout: 10000 }
    );

    if (!response) {
      throw new NotFoundError('Job');
    }

    return response;
  }

  async getJobById(jobId: string): Promise<ProcessingJob> {
    if (!jobId?.trim()) {
      throw new ValidationError('Job ID is required');
    }

    const response = await getHttpClient().get<ProcessingJob>(
      `/jobs/${jobId}`,
      { timeout: 10000 }
    );

    if (!response) {
      throw new NotFoundError('Job');
    }

    return response;
  }

  async cancelJob(jobId: string): Promise<void> {
    if (!jobId?.trim()) {
      throw new ValidationError('Job ID is required');
    }

    await getHttpClient().post(
      `/jobs/${jobId}/cancel`,
      {},
      { timeout: 10000 }
    );
  }

  pollJobStatus(
    projectId: string,
    onUpdate: (job: ProcessingJob) => void,
    onComplete: (job: ProcessingJob) => void,
    onError: (error: Error) => void
  ): () => void {
    let isActive = true;
    let pollCount = 0;
    const maxPolls = Math.ceil(MAX_POLL_DURATION_MS / POLL_INTERVAL_MS);

    const poll = async () => {
      if (!isActive || pollCount >= maxPolls) {
        return;
      }

      try {
        const response = await this.getJobStatus(projectId);
        const job = response.job;

        pollCount++;
        onUpdate(job);

        if (job.status === 'completed' || job.status === 'failed') {
          onComplete(job);
          isActive = false;
          return;
        }

        if (isActive) {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (error) {
        if (isActive) {
          onError(error instanceof Error ? error : new Error(String(error)));

          if (pollCount < maxPolls) {
            setTimeout(poll, POLL_INTERVAL_MS);
          }
        }
      }
    };

    poll();

    return () => {
      isActive = false;
    };
  }
}

export const jobService = new JobService();
