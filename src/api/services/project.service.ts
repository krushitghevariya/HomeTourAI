import { getHttpClient } from '../client/api-instance';
import { validateProjectName } from '../middleware/validation';
import { NotFoundError, ValidationError, AuthorizationError } from '../errors';
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectDetailResponse,
} from '../types';

export class ProjectService {
  async listProjects(): Promise<Project[]> {
    return getHttpClient().get<Project[]>('/projects');
  }

  async getProjectDetail(projectId: string): Promise<ProjectDetailResponse> {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    const response = await getHttpClient().get<ProjectDetailResponse>(
      `/projects/${projectId}`,
      { timeout: 15000 }
    );

    if (!response) {
      throw new NotFoundError('Project');
    }

    return response;
  }

  async createProject(request: CreateProjectRequest): Promise<Project> {
    validateProjectName(request.name);

    if (!request.propertyType) {
      throw new ValidationError('Property type is required', {
        field: 'propertyType',
      });
    }

    const validPropertyTypes = [
      'apartment',
      'villa',
      'office',
      'condo',
      'house',
    ];
    if (!validPropertyTypes.includes(request.propertyType)) {
      throw new ValidationError(
        `Invalid property type. Allowed: ${validPropertyTypes.join(', ')}`,
        { field: 'propertyType', allowed: validPropertyTypes }
      );
    }

    return getHttpClient().post<Project>('/projects', request);
  }

  async updateProject(
    projectId: string,
    request: UpdateProjectRequest
  ): Promise<Project> {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    if (request.name) {
      validateProjectName(request.name);
    }

    return getHttpClient().put<Project>(
      `/projects/${projectId}`,
      request
    );
  }

  async deleteProject(projectId: string): Promise<void> {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    await getHttpClient().delete(`/projects/${projectId}`);
  }

  async duplicateProject(projectId: string): Promise<Project> {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    return getHttpClient().post<Project>(
      `/projects/${projectId}/duplicate`,
      {}
    );
  }

  async exportProjectData(projectId: string): Promise<Blob> {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    return getHttpClient().get<Blob>(
      `/projects/${projectId}/export`,
      { timeout: 60000 }
    );
  }
}

export const projectService = new ProjectService();
