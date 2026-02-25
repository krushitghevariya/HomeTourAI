export type JobType = 'tour_360_generation' | 'ar_render' | 'video_stabilization';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ProcessingJob {
  id: string;
  projectId: string;
  jobType: JobType;
  status: JobStatus;
  progressPercentage: number;
  errorMessage?: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  estimatedDuration?: number;
}

export interface StartGenerationRequest {
  projectId: string;
  generationType: 'tour_360' | 'ar_preview';
  config?: {
    stitchingQuality?: 'low' | 'medium' | 'high';
    enableStabilization?: boolean;
    enableBrightnessCorrection?: boolean;
  };
}

export interface StartGenerationResponse {
  job: ProcessingJob;
  estimatedDuration: number;
}

export interface JobStatusResponse {
  job: ProcessingJob;
  output?: {
    id: string;
    outputType: string;
    fileUrl: string;
  };
}

export interface JobProgressUpdate {
  jobId: string;
  status: JobStatus;
  progress: number;
  estimatedTimeRemaining?: number;
}
