export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';
export type PropertyType = 'apartment' | 'villa' | 'office' | 'condo' | 'house';

export interface Project {
  id: string;
  userId: string;
  name: string;
  propertyType: PropertyType;
  description?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export interface CreateProjectRequest {
  name: string;
  propertyType: PropertyType;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  propertyType?: PropertyType;
  description?: string;
}

export interface ProjectDetailResponse {
  project: Project;
  mediaCount: number;
  processingJob?: {
    id: string;
    status: string;
    progress: number;
  };
  output?: {
    id: string;
    outputType: 'video_360' | 'ar_video';
    fileUrl: string;
    shareToken: string;
  };
}
