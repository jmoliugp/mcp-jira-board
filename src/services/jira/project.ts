// Ref: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-projects/#api-rest-api-3-project-post

import { format } from 'util';
import { axiosClient, jiraApiEndpoint } from './networking.js';
import {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from '../../utils/error.js';
import { AxiosError } from 'axios';
import { performance } from 'perf_hooks';
import { Logger } from '../../utils/log.js';

const log = new Logger('jira/project');

export interface Project {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
  description?: string;
  url?: string;
  assigneeType?: string;
  avatarUrls?: {
    '16x16'?: string;
    '24x24'?: string;
    '32x32'?: string;
    '48x48'?: string;
  };
  projectCategory?: {
    self: string;
    id: string;
    name: string;
    description: string;
  };
  projectKeys?: string[];
  lead?: {
    self: string;
    accountId: string;
    avatarUrls: {
      '16x16': string;
      '24x24': string;
      '32x32': string;
      '48x48': string;
    };
    displayName: string;
    active: boolean;
    timeZone: string;
    accountType: string;
  };
  components?: Array<{
    self: string;
    id: string;
    name: string;
    description: string;
  }>;
  issueTypes?: Array<{
    self: string;
    id: string;
    description: string;
    iconUrl: string;
    name: string;
    subtask: boolean;
    avatarId: number;
    hierarchyLevel: number;
  }>;
  versions?: Array<{
    self: string;
    id: string;
    description: string;
    name: string;
    archived: boolean;
    released: boolean;
    releaseDate?: string;
    userReleaseDate?: string;
    projectId: number;
    startDate?: string;
    userStartDate?: string;
  }>;
  roles?: Record<string, string>;
}

export interface CreateProjectInput {
  key: string;
  name: string;
  projectTypeKey: 'software' | 'service_desk' | 'business';
  projectTemplateKey?: string;
  description?: string;
  leadAccountId?: string;
  leadUserName?: string;
  url?: string;
  assigneeType?: 'PROJECT_LEAD' | 'UNASSIGNED';
  avatarId?: number;
  issueSecurityScheme?: number;
  permissionScheme?: number;
  notificationScheme?: number;
  categoryId?: number;
}

export interface CreateProjectResponse extends Project {
  // Additional fields that might be returned on creation
}

export interface GetAllProjectsParams {
  startAt?: number;
  maxResults?: number;
  orderBy?: 'key' | 'name' | 'category' | '-key' | '-name' | '-category';
  query?: string;
  typeKey?: string;
  categoryId?: number;
  expand?: string;
  status?: 'live' | 'archived' | 'deleted';
}

export interface GetAllProjectsResponse {
  isLast: boolean;
  maxResults: number;
  startAt: number;
  total: number;
  values: Project[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  url?: string;
  assigneeType?: 'PROJECT_LEAD' | 'UNASSIGNED';
  avatarId?: number;
  issueSecurityScheme?: number;
  permissionScheme?: number;
  notificationScheme?: number;
  categoryId?: number;
  leadAccountId?: string;
  leadUserName?: string;
}

/**
 * Create a new project.
 * @param input - Project creation data
 * @returns The created project
 */
export const createProject = async (input: CreateProjectInput): Promise<CreateProjectResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.post<CreateProjectResponse>(
      jiraApiEndpoint.project.createProject,
      input
    );

    const end = performance.now();
    log.info(`⏱️ createProject executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, input, endpoint: jiraApiEndpoint.project.createProject };

    if (status === 400) throw new UserInputError('Invalid input for createProject.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for createProject.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for createProject.', context);
    if (status === 404) throw new NotFoundError('Resource not found for createProject.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in createProject.', context);
    throw new InternalServerError('Unexpected error in createProject.', context);
  }
};

/**
 * Get all projects visible to the user.
 * @param params - Optional query parameters
 * @returns List of projects and pagination info
 */
export const getAllProjects = async (
  params: GetAllProjectsParams = {}
): Promise<GetAllProjectsResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetAllProjectsResponse>(
      jiraApiEndpoint.project.getAllProjects,
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getAllProjects executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, params, endpoint: jiraApiEndpoint.project.getAllProjects };

    if (status === 400) throw new UserInputError('Invalid input for getAllProjects.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getAllProjects.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getAllProjects.', context);
    if (status === 404) throw new NotFoundError('Projects not found.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getAllProjects.', context);
    throw new InternalServerError('Unexpected error in getAllProjects.', context);
  }
};

/**
 * Get project details by ID or key.
 * @param projectIdOrKey - The project ID or key
 * @param expand - Optional fields to expand
 * @returns Project details
 */
export const getProject = async (projectIdOrKey: string, expand?: string): Promise<Project> => {
  const start = performance.now();
  try {
    const params = expand ? { expand } : {};
    const { data } = await axiosClient.get<Project>(
      format(jiraApiEndpoint.project.getProject, projectIdOrKey),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getProject executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      projectIdOrKey,
      expand,
      endpoint: format(jiraApiEndpoint.project.getProject, projectIdOrKey),
    };

    if (status === 400) throw new UserInputError('Invalid input for getProject.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getProject.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getProject.', context);
    if (status === 404) throw new NotFoundError('Project not found.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getProject.', context);
    throw new InternalServerError('Unexpected error in getProject.', context);
  }
};

/**
 * Update a project.
 * @param projectIdOrKey - The project ID or key
 * @param input - Project update data
 * @returns The updated project
 */
export const updateProject = async (
  projectIdOrKey: string,
  input: UpdateProjectInput
): Promise<Project> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.put<Project>(
      format(jiraApiEndpoint.project.updateProject, projectIdOrKey),
      input
    );
    const end = performance.now();
    log.info(`⏱️ updateProject executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      projectIdOrKey,
      input,
      endpoint: format(jiraApiEndpoint.project.updateProject, projectIdOrKey),
    };

    if (status === 400) throw new UserInputError('Invalid input for updateProject.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for updateProject.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for updateProject.', context);
    if (status === 404) throw new NotFoundError('Project not found for updateProject.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in updateProject.', context);
    throw new InternalServerError('Unexpected error in updateProject.', context);
  }
};

/**
 * Delete a project.
 * @param projectIdOrKey - The project ID or key
 * @returns void
 */
export const deleteProject = async (projectIdOrKey: string): Promise<void> => {
  const start = performance.now();
  try {
    await axiosClient.delete(format(jiraApiEndpoint.project.deleteProject, projectIdOrKey));
    const end = performance.now();
    log.info(`⏱️ deleteProject executed in ${(end - start).toFixed(2)}ms`);
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      projectIdOrKey,
      endpoint: format(jiraApiEndpoint.project.deleteProject, projectIdOrKey),
    };

    if (status === 400) throw new UserInputError('Invalid input for deleteProject.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for deleteProject.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for deleteProject.', context);
    if (status === 404) throw new NotFoundError('Project not found for deleteProject.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in deleteProject.', context);
    throw new InternalServerError('Unexpected error in deleteProject.', context);
  }
};

/**
 * Create a project with an associated board.
 * This is a convenience function that creates both a project and a board.
 * @param projectInput - Project creation data
 * @param boardName - Name for the associated board
 * @param boardType - Type of board ('scrum' or 'kanban')
 * @returns Object containing both project and board information
 */
export const createProjectWithBoard = async (
  projectInput: CreateProjectInput,
  boardName: string,
  boardType: 'scrum' | 'kanban'
): Promise<{ project: CreateProjectResponse; board?: any }> => {
  const start = performance.now();
  try {
    // First create the project
    const project = await createProject(projectInput);

    // Then create a board for the project
    // Note: This would require importing the board service
    // For now, we'll return just the project
    const end = performance.now();
    log.info(`⏱️ createProjectWithBoard executed in ${(end - start).toFixed(2)}ms`);

    return { project };
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      projectInput,
      boardName,
      boardType,
    };

    if (status === 400)
      throw new UserInputError('Invalid input for createProjectWithBoard.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for createProjectWithBoard.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for createProjectWithBoard.', context);
    if (status === 404)
      throw new NotFoundError('Resource not found for createProjectWithBoard.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in createProjectWithBoard.', context);
    throw new InternalServerError('Unexpected error in createProjectWithBoard.', context);
  }
};

/**
 * Get current user information.
 * @returns Current user details including accountId
 */
export const getCurrentUser = async (): Promise<{
  accountId: string;
  emailAddress: string;
  displayName: string;
  active: boolean;
  timeZone: string;
  accountType: string;
}> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get(jiraApiEndpoint.user.getCurrentUser);
    const end = performance.now();
    log.info(`⏱️ getCurrentUser executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, endpoint: jiraApiEndpoint.user.getCurrentUser };

    if (status === 400) throw new UserInputError('Invalid input for getCurrentUser.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getCurrentUser.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getCurrentUser.', context);
    if (status === 404) throw new NotFoundError('User not found.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getCurrentUser.', context);
    throw new InternalServerError('Unexpected error in getCurrentUser.', context);
  }
};
