import { useCallback, useState } from 'react';
import { projectService } from '../api/services/project.service';
import { useAsyncAction } from './use-async-action';
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectDetailResponse,
} from '../api/types';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const listAction = useAsyncAction<Project[]>();
  const createAction = useAsyncAction<Project>();
  const deleteAction = useAsyncAction<void>();
  const detailAction = useAsyncAction<ProjectDetailResponse>();

  const fetchProjects = useCallback(async () => {
    return await listAction.execute(async () => {
      const data = await projectService.listProjects();
      setProjects(data);
      return data;
    });
  }, [listAction]);

  const createProject = useCallback(
    async (request: CreateProjectRequest) => {
      const result = await createAction.execute(async () => {
        const newProject = await projectService.createProject(request);
        setProjects((prev) => [...prev, newProject]);
        return newProject;
      });

      return result;
    },
    [createAction]
  );

  const getProjectDetail = useCallback(
    async (projectId: string) => {
      return await detailAction.execute(async () => {
        return await projectService.getProjectDetail(projectId);
      });
    },
    [detailAction]
  );

  const updateProject = useCallback(
    async (projectId: string, request: UpdateProjectRequest) => {
      const result = await createAction.execute(async () => {
        const updated = await projectService.updateProject(projectId, request);
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? updated : p))
        );
        return updated;
      });

      return result;
    },
    [createAction]
  );

  const removeProject = useCallback(
    async (projectId: string) => {
      await deleteAction.execute(async () => {
        await projectService.deleteProject(projectId);
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      });
    },
    [deleteAction]
  );

  return {
    projects,
    loading: listAction.loading,
    error: listAction.errorMessage,
    fetchProjects,
    createProject: {
      execute: createProject,
      loading: createAction.loading,
      error: createAction.errorMessage,
    },
    updateProject: {
      execute: updateProject,
      loading: createAction.loading,
      error: createAction.errorMessage,
    },
    deleteProject: {
      execute: removeProject,
      loading: deleteAction.loading,
      error: deleteAction.errorMessage,
    },
    getProjectDetail: {
      execute: getProjectDetail,
      loading: detailAction.loading,
      error: detailAction.errorMessage,
      data: detailAction.data,
    },
  };
};
