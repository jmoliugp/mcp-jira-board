// Ref: https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/#api-group-board

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

const log = new Logger('jira/board');

export interface Board {
  id: number;
  name: string;
  type: 'scrum' | 'kanban';
  self: string;
}

export interface GetAllBoardsParams {
  startAt?: number;
  maxResults?: number;
  type?: 'scrum' | 'kanban';
  name?: string;
  projectKeyOrId?: string;
}

export interface GetAllBoardsResponse {
  isLast: boolean;
  maxResults: number;
  startAt: number;
  total: number;
  values: Board[];
}

export interface CreateBoardInput {
  name: string;
  type: 'scrum' | 'kanban';
  filterId: number;
  location?: {
    type: 'project' | 'user';
    projectKeyOrId?: string;
  };
}

export interface BoardDetails extends Board {
  // You can add more fields based on the actual API response
}

export interface BoardBacklogIssue {
  id: string;
  key: string;
  // You can add more fields based on the actual API response
}

export interface GetBoardBacklogResponse {
  issues: BoardBacklogIssue[];
  startAt: number;
  maxResults: number;
  total: number;
}

/**
 * Get all boards visible to the user.
 * @param params - Optional query parameters
 * @returns List of boards and pagination info
 */
export const getAllBoards = async (
  params: GetAllBoardsParams = {}
): Promise<GetAllBoardsResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetAllBoardsResponse>(
      jiraApiEndpoint.board.getAllBoards,
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getAllBoards executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, params, endpoint: jiraApiEndpoint.board.getAllBoards };

    if (status === 400) throw new UserInputError('Invalid input for getAllBoards.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getAllBoards.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getAllBoards.', context);
    if (status === 404) throw new NotFoundError('Boards not found.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getAllBoards.', context);
    throw new InternalServerError('Unexpected error in getAllBoards.', context);
  }
};

/**
 * Create a new board.
 * @param input - Board creation data
 * @returns The created board
 */
export const createBoard = async (input: CreateBoardInput): Promise<BoardDetails> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.post<BoardDetails>(jiraApiEndpoint.board.createBoard, input);

    const end = performance.now();
    log.info(`⏱️ createBoard executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, input, endpoint: jiraApiEndpoint.board.createBoard };

    if (status === 400) throw new UserInputError('Invalid input for createBoard.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for createBoard.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for createBoard.', context);
    if (status === 404) throw new NotFoundError('Resource not found for createBoard.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in createBoard.', context);
    throw new InternalServerError('Unexpected error in createBoard.', context);
  }
};

/**
 * Get board details by ID.
 * @param boardId - The board ID
 * @returns Board details
 */
export const getBoardById = async (boardId: number): Promise<BoardDetails> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<BoardDetails>(
      format(jiraApiEndpoint.board.getBoardById, boardId)
    );
    const end = performance.now();
    log.info(`⏱️ getBoardById executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      endpoint: format(jiraApiEndpoint.board.getBoardById, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardById.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardById.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getBoardById.', context);
    if (status === 404) throw new NotFoundError('Board not found.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardById.', context);
    throw new InternalServerError('Unexpected error in getBoardById.', context);
  }
};

/**
 * Delete a board by ID.
 * @param boardId - The board ID
 * @returns void
 */
export const deleteBoard = async (boardId: number): Promise<void> => {
  const start = performance.now();
  try {
    await axiosClient.delete(format(jiraApiEndpoint.board.deleteBoard, boardId));
    const end = performance.now();
    log.info(`⏱️ deleteBoard executed in ${(end - start).toFixed(2)}ms`);
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      endpoint: format(jiraApiEndpoint.board.deleteBoard, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for deleteBoard.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for deleteBoard.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for deleteBoard.', context);
    if (status === 404) throw new NotFoundError('Board not found for deleteBoard.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in deleteBoard.', context);
    throw new InternalServerError('Unexpected error in deleteBoard.', context);
  }
};

/**
 * Get board by filter ID.
 * @param filterId - The filter ID
 * @returns Board details
 */
export const getBoardByFilterId = async (filterId: number): Promise<BoardDetails> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<BoardDetails>(
      format(jiraApiEndpoint.board.getBoardByFilterId, filterId)
    );
    const end = performance.now();
    log.info(`⏱️ getBoardByFilterId executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      filterId,
      endpoint: format(jiraApiEndpoint.board.getBoardByFilterId, filterId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardByFilterId.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardByFilterId.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for getBoardByFilterId.', context);
    if (status === 404) throw new NotFoundError('Board not found for getBoardByFilterId.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardByFilterId.', context);
    throw new InternalServerError('Unexpected error in getBoardByFilterId.', context);
  }
};

/**
 * Get issues for the backlog of a board.
 * @param boardId - The board ID
 * @param params - Optional query parameters (startAt, maxResults, etc.)
 * @returns Issues in the backlog of the board
 */
export const getBoardBacklog = async (
  boardId: number,
  params: { startAt?: number; maxResults?: number } = {}
): Promise<GetBoardBacklogResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetBoardBacklogResponse>(
      format(jiraApiEndpoint.board.getBoardBacklog, boardId),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getBoardBacklog executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      params,
      endpoint: format(jiraApiEndpoint.board.getBoardBacklog, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardBacklog.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardBacklog.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getBoardBacklog.', context);
    if (status === 404) throw new NotFoundError('Board not found for getBoardBacklog.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardBacklog.', context);
    throw new InternalServerError('Unexpected error in getBoardBacklog.', context);
  }
};

export interface BoardConfiguration {
  id: number;
  name: string;
  type: string;
  // You can add more fields based on the actual API response
}

/**
 * Get configuration for a board.
 * @param boardId - The board ID
 * @returns Board configuration
 */
export const getBoardConfiguration = async (boardId: number): Promise<BoardConfiguration> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<BoardConfiguration>(
      format(jiraApiEndpoint.board.getBoardConfiguration, boardId)
    );
    const end = performance.now();
    log.info(`⏱️ getBoardConfiguration executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      endpoint: format(jiraApiEndpoint.board.getBoardConfiguration, boardId),
    };

    if (status === 400)
      throw new UserInputError('Invalid input for getBoardConfiguration.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardConfiguration.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for getBoardConfiguration.', context);
    if (status === 404)
      throw new NotFoundError('Board not found for getBoardConfiguration.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardConfiguration.', context);
    throw new InternalServerError('Unexpected error in getBoardConfiguration.', context);
  }
};

export interface Epic {
  id: number;
  key: string;
  name: string;
  summary: string;
  color: {
    key: string;
  };
  done: boolean;
  // You can add more fields based on the actual API response
}

export interface GetBoardEpicsResponse {
  isLast: boolean;
  maxResults: number;
  startAt: number;
  total: number;
  values: Epic[];
}

export interface EpicIssue {
  id: string;
  key: string;
  // You can add more fields based on the actual API response
}

export interface GetEpicIssuesResponse {
  issues: EpicIssue[];
  startAt: number;
  maxResults: number;
  total: number;
}

/**
 * Get epics for a board.
 * @param boardId - The board ID
 * @param params - Optional query parameters (startAt, maxResults, etc.)
 * @returns Epics in the board
 */
export const getBoardEpics = async (
  boardId: number,
  params: { startAt?: number; maxResults?: number } = {}
): Promise<GetBoardEpicsResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetBoardEpicsResponse>(
      format(jiraApiEndpoint.board.getBoardEpics, boardId),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getBoardEpics executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      params,
      endpoint: format(jiraApiEndpoint.board.getBoardEpics, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardEpics.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardEpics.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getBoardEpics.', context);
    if (status === 404) throw new NotFoundError('Board not found for getBoardEpics.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardEpics.', context);
    throw new InternalServerError('Unexpected error in getBoardEpics.', context);
  }
};

/**
 * Get issues without epic for a board.
 * @param boardId - The board ID
 * @param params - Optional query parameters (startAt, maxResults, etc.)
 * @returns Issues without epic in the board
 */
export const getBoardEpicNoneIssues = async (
  boardId: number,
  params: { startAt?: number; maxResults?: number } = {}
): Promise<GetEpicIssuesResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetEpicIssuesResponse>(
      format(jiraApiEndpoint.board.getBoardEpicNoneIssues, boardId),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getBoardEpicNoneIssues executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      params,
      endpoint: format(jiraApiEndpoint.board.getBoardEpicNoneIssues, boardId),
    };

    if (status === 400)
      throw new UserInputError('Invalid input for getBoardEpicNoneIssues.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardEpicNoneIssues.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for getBoardEpicNoneIssues.', context);
    if (status === 404)
      throw new NotFoundError('Board not found for getBoardEpicNoneIssues.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardEpicNoneIssues.', context);
    throw new InternalServerError('Unexpected error in getBoardEpicNoneIssues.', context);
  }
};

/**
 * Get issues for a specific epic in a board.
 * @param boardId - The board ID
 * @param epicId - The epic ID
 * @param params - Optional query parameters (startAt, maxResults, etc.)
 * @returns Issues for the epic in the board
 */
export const getBoardEpicIssues = async (
  boardId: number,
  epicId: number,
  params: { startAt?: number; maxResults?: number } = {}
): Promise<GetEpicIssuesResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetEpicIssuesResponse>(
      format(jiraApiEndpoint.board.getBoardEpicIssues, boardId, epicId),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getBoardEpicIssues executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      epicId,
      params,
      endpoint: format(jiraApiEndpoint.board.getBoardEpicIssues, boardId, epicId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardEpicIssues.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardEpicIssues.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for getBoardEpicIssues.', context);
    if (status === 404)
      throw new NotFoundError('Board or epic not found for getBoardEpicIssues.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardEpicIssues.', context);
    throw new InternalServerError('Unexpected error in getBoardEpicIssues.', context);
  }
};

export interface BoardFeature {
  boardId: number;
  feature: string;
  enabled: boolean;
  // You can add more fields based on the actual API response
}

export interface UpdateBoardFeaturesInput {
  features: BoardFeature[];
}

export interface BoardIssue {
  id: string;
  key: string;
  // You can add more fields based on the actual API response
}

export interface GetBoardIssuesResponse {
  issues: BoardIssue[];
  startAt: number;
  maxResults: number;
  total: number;
}

export interface MoveIssuesToBoardInput {
  issues: string[];
  rankAfterIssue?: string;
  rankBeforeIssue?: string;
  rankCustomFieldId?: number;
}

export interface BoardProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  // You can add more fields based on the actual API response
}

export interface GetBoardProjectsResponse {
  isLast: boolean;
  maxResults: number;
  startAt: number;
  total: number;
  values: BoardProject[];
}

export interface BoardProperty {
  key: string;
  value: any;
  // You can add more fields based on the actual API response
}

export interface GetBoardPropertiesResponse {
  keys: BoardProperty[];
}

export interface BoardQuickFilter {
  id: number;
  boardId: number;
  name: string;
  jql: string;
  description?: string;
  // You can add more fields based on the actual API response
}

export interface GetBoardQuickFiltersResponse {
  isLast: boolean;
  maxResults: number;
  startAt: number;
  total: number;
  values: BoardQuickFilter[];
}

export interface BoardReport {
  id: string;
  name: string;
  description?: string;
  // You can add more fields based on the actual API response
}

export interface GetBoardReportsResponse {
  reports: BoardReport[];
}

export interface BoardSprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
  // You can add more fields based on the actual API response
}

export interface GetBoardSprintsResponse {
  isLast: boolean;
  maxResults: number;
  startAt: number;
  total: number;
  values: BoardSprint[];
}

export interface SprintIssue {
  id: string;
  key: string;
  // You can add more fields based on the actual API response
}

export interface GetSprintIssuesResponse {
  issues: SprintIssue[];
  startAt: number;
  maxResults: number;
  total: number;
}

export interface BoardVersion {
  id: string;
  name: string;
  description?: string;
  archived: boolean;
  released: boolean;
  releaseDate?: string;
  // You can add more fields based on the actual API response
}

export interface GetBoardVersionsResponse {
  isLast: boolean;
  maxResults: number;
  startAt: number;
  total: number;
  values: BoardVersion[];
}

/**
 * Get features for a board.
 * @param boardId - The board ID
 * @returns Board features
 */
export const getBoardFeatures = async (boardId: number): Promise<BoardFeature[]> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<BoardFeature[]>(
      format(jiraApiEndpoint.board.getBoardFeatures, boardId)
    );
    const end = performance.now();
    log.info(`⏱️ getBoardFeatures executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      endpoint: format(jiraApiEndpoint.board.getBoardFeatures, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardFeatures.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardFeatures.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getBoardFeatures.', context);
    if (status === 404) throw new NotFoundError('Board not found for getBoardFeatures.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardFeatures.', context);
    throw new InternalServerError('Unexpected error in getBoardFeatures.', context);
  }
};

/**
 * Update features for a board.
 * @param boardId - The board ID
 * @param input - Features to update
 * @returns Updated board features
 */
export const updateBoardFeatures = async (
  boardId: number,
  input: UpdateBoardFeaturesInput
): Promise<BoardFeature[]> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.put<BoardFeature[]>(
      format(jiraApiEndpoint.board.updateBoardFeatures, boardId),
      input
    );
    const end = performance.now();
    log.info(`⏱️ updateBoardFeatures executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      input,
      endpoint: format(jiraApiEndpoint.board.updateBoardFeatures, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for updateBoardFeatures.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for updateBoardFeatures.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for updateBoardFeatures.', context);
    if (status === 404)
      throw new NotFoundError('Board not found for updateBoardFeatures.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in updateBoardFeatures.', context);
    throw new InternalServerError('Unexpected error in updateBoardFeatures.', context);
  }
};

/**
 * Get issues for a board.
 * @param boardId - The board ID
 * @param params - Optional query parameters (startAt, maxResults, etc.)
 * @returns Issues in the board
 */
export const getBoardIssues = async (
  boardId: number,
  params: { startAt?: number; maxResults?: number } = {}
): Promise<GetBoardIssuesResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetBoardIssuesResponse>(
      format(jiraApiEndpoint.board.getBoardIssues, boardId),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getBoardIssues executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      params,
      endpoint: format(jiraApiEndpoint.board.getBoardIssues, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardIssues.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardIssues.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getBoardIssues.', context);
    if (status === 404) throw new NotFoundError('Board not found for getBoardIssues.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardIssues.', context);
    throw new InternalServerError('Unexpected error in getBoardIssues.', context);
  }
};

/**
 * Move issues to a board.
 * @param boardId - The board ID
 * @param input - Issues to move and ranking parameters
 * @returns void
 */
export const moveIssuesToBoard = async (
  boardId: number,
  input: MoveIssuesToBoardInput
): Promise<void> => {
  const start = performance.now();
  try {
    await axiosClient.post(format(jiraApiEndpoint.board.moveIssuesToBoard, boardId), input);
    const end = performance.now();
    log.info(`⏱️ moveIssuesToBoard executed in ${(end - start).toFixed(2)}ms`);
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      input,
      endpoint: format(jiraApiEndpoint.board.moveIssuesToBoard, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for moveIssuesToBoard.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for moveIssuesToBoard.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for moveIssuesToBoard.', context);
    if (status === 404) throw new NotFoundError('Board not found for moveIssuesToBoard.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in moveIssuesToBoard.', context);
    throw new InternalServerError('Unexpected error in moveIssuesToBoard.', context);
  }
};

/**
 * Get projects for a board.
 * @param boardId - The board ID
 * @param params - Optional query parameters (startAt, maxResults, etc.)
 * @returns Projects associated with the board
 */
export const getBoardProjects = async (
  boardId: number,
  params: { startAt?: number; maxResults?: number } = {}
): Promise<GetBoardProjectsResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetBoardProjectsResponse>(
      format(jiraApiEndpoint.board.getBoardProjects, boardId),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getBoardProjects executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      params,
      endpoint: format(jiraApiEndpoint.board.getBoardProjects, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardProjects.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardProjects.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getBoardProjects.', context);
    if (status === 404) throw new NotFoundError('Board not found for getBoardProjects.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardProjects.', context);
    throw new InternalServerError('Unexpected error in getBoardProjects.', context);
  }
};

/**
 * Get full project information for a board.
 * @param boardId - The board ID
 * @param params - Optional query parameters (startAt, maxResults, etc.)
 * @returns Full project information associated with the board
 */
export const getBoardProjectsFull = async (
  boardId: number,
  params: { startAt?: number; maxResults?: number } = {}
): Promise<GetBoardProjectsResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetBoardProjectsResponse>(
      format(jiraApiEndpoint.board.getBoardProjectsFull, boardId),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getBoardProjectsFull executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      params,
      endpoint: format(jiraApiEndpoint.board.getBoardProjectsFull, boardId),
    };

    if (status === 400)
      throw new UserInputError('Invalid input for getBoardProjectsFull.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardProjectsFull.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for getBoardProjectsFull.', context);
    if (status === 404)
      throw new NotFoundError('Board not found for getBoardProjectsFull.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardProjectsFull.', context);
    throw new InternalServerError('Unexpected error in getBoardProjectsFull.', context);
  }
};

/**
 * Get properties for a board.
 * @param boardId - The board ID
 * @returns Board properties
 */
export const getBoardProperties = async (boardId: number): Promise<GetBoardPropertiesResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetBoardPropertiesResponse>(
      format(jiraApiEndpoint.board.getBoardProperties, boardId)
    );
    const end = performance.now();
    log.info(`⏱️ getBoardProperties executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      endpoint: format(jiraApiEndpoint.board.getBoardProperties, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardProperties.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardProperties.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for getBoardProperties.', context);
    if (status === 404) throw new NotFoundError('Board not found for getBoardProperties.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardProperties.', context);
    throw new InternalServerError('Unexpected error in getBoardProperties.', context);
  }
};

/**
 * Get a specific property for a board.
 * @param boardId - The board ID
 * @param propertyKey - The property key
 * @returns Board property value
 */
export const getBoardProperty = async (boardId: number, propertyKey: string): Promise<any> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get(
      format(jiraApiEndpoint.board.getBoardProperty, boardId, propertyKey)
    );
    const end = performance.now();
    log.info(`⏱️ getBoardProperty executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      propertyKey,
      endpoint: format(jiraApiEndpoint.board.getBoardProperty, boardId, propertyKey),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardProperty.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardProperty.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getBoardProperty.', context);
    if (status === 404)
      throw new NotFoundError('Board or property not found for getBoardProperty.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardProperty.', context);
    throw new InternalServerError('Unexpected error in getBoardProperty.', context);
  }
};

/**
 * Set a property for a board.
 * @param boardId - The board ID
 * @param propertyKey - The property key
 * @param value - The property value
 * @returns void
 */
export const setBoardProperty = async (
  boardId: number,
  propertyKey: string,
  value: any
): Promise<void> => {
  const start = performance.now();
  try {
    await axiosClient.put(
      format(jiraApiEndpoint.board.setBoardProperty, boardId, propertyKey),
      value
    );
    const end = performance.now();
    log.info(`⏱️ setBoardProperty executed in ${(end - start).toFixed(2)}ms`);
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      propertyKey,
      value,
      endpoint: format(jiraApiEndpoint.board.setBoardProperty, boardId, propertyKey),
    };

    if (status === 400) throw new UserInputError('Invalid input for setBoardProperty.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for setBoardProperty.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for setBoardProperty.', context);
    if (status === 404) throw new NotFoundError('Board not found for setBoardProperty.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in setBoardProperty.', context);
    throw new InternalServerError('Unexpected error in setBoardProperty.', context);
  }
};

/**
 * Delete a property for a board.
 * @param boardId - The board ID
 * @param propertyKey - The property key
 * @returns void
 */
export const deleteBoardProperty = async (boardId: number, propertyKey: string): Promise<void> => {
  const start = performance.now();
  try {
    await axiosClient.delete(
      format(jiraApiEndpoint.board.deleteBoardProperty, boardId, propertyKey)
    );
    const end = performance.now();
    log.info(`⏱️ deleteBoardProperty executed in ${(end - start).toFixed(2)}ms`);
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      propertyKey,
      endpoint: format(jiraApiEndpoint.board.deleteBoardProperty, boardId, propertyKey),
    };

    if (status === 400) throw new UserInputError('Invalid input for deleteBoardProperty.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for deleteBoardProperty.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for deleteBoardProperty.', context);
    if (status === 404)
      throw new NotFoundError('Board or property not found for deleteBoardProperty.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in deleteBoardProperty.', context);
    throw new InternalServerError('Unexpected error in deleteBoardProperty.', context);
  }
};

/**
 * Get quick filters for a board.
 * @param boardId - The board ID
 * @param params - Optional query parameters (startAt, maxResults, etc.)
 * @returns Quick filters for the board
 */
export const getBoardQuickFilters = async (
  boardId: number,
  params: { startAt?: number; maxResults?: number } = {}
): Promise<GetBoardQuickFiltersResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetBoardQuickFiltersResponse>(
      format(jiraApiEndpoint.board.getBoardQuickFilters, boardId),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getBoardQuickFilters executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      params,
      endpoint: format(jiraApiEndpoint.board.getBoardQuickFilters, boardId),
    };

    if (status === 400)
      throw new UserInputError('Invalid input for getBoardQuickFilters.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardQuickFilters.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for getBoardQuickFilters.', context);
    if (status === 404)
      throw new NotFoundError('Board not found for getBoardQuickFilters.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardQuickFilters.', context);
    throw new InternalServerError('Unexpected error in getBoardQuickFilters.', context);
  }
};

/**
 * Get a specific quick filter for a board.
 * @param boardId - The board ID
 * @param quickFilterId - The quick filter ID
 * @returns Quick filter details
 */
export const getBoardQuickFilter = async (
  boardId: number,
  quickFilterId: number
): Promise<BoardQuickFilter> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<BoardQuickFilter>(
      format(jiraApiEndpoint.board.getBoardQuickFilter, boardId, quickFilterId)
    );
    const end = performance.now();
    log.info(`⏱️ getBoardQuickFilter executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      quickFilterId,
      endpoint: format(jiraApiEndpoint.board.getBoardQuickFilter, boardId, quickFilterId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardQuickFilter.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardQuickFilter.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for getBoardQuickFilter.', context);
    if (status === 404)
      throw new NotFoundError('Board or quick filter not found for getBoardQuickFilter.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardQuickFilter.', context);
    throw new InternalServerError('Unexpected error in getBoardQuickFilter.', context);
  }
};

/**
 * Get reports for a board.
 * @param boardId - The board ID
 * @returns Board reports
 */
export const getBoardReports = async (boardId: number): Promise<GetBoardReportsResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetBoardReportsResponse>(
      format(jiraApiEndpoint.board.getBoardReports, boardId)
    );
    const end = performance.now();
    log.info(`⏱️ getBoardReports executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      endpoint: format(jiraApiEndpoint.board.getBoardReports, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardReports.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardReports.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getBoardReports.', context);
    if (status === 404) throw new NotFoundError('Board not found for getBoardReports.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardReports.', context);
    throw new InternalServerError('Unexpected error in getBoardReports.', context);
  }
};

/**
 * Get sprints for a board.
 * @param boardId - The board ID
 * @param params - Optional query parameters (startAt, maxResults, state, etc.)
 * @returns Sprints for the board
 */
export const getBoardSprints = async (
  boardId: number,
  params: { startAt?: number; maxResults?: number; state?: string } = {}
): Promise<GetBoardSprintsResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetBoardSprintsResponse>(
      format(jiraApiEndpoint.board.getBoardSprints, boardId),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getBoardSprints executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      params,
      endpoint: format(jiraApiEndpoint.board.getBoardSprints, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardSprints.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardSprints.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getBoardSprints.', context);
    if (status === 404) throw new NotFoundError('Board not found for getBoardSprints.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardSprints.', context);
    throw new InternalServerError('Unexpected error in getBoardSprints.', context);
  }
};

/**
 * Get issues for a specific sprint in a board.
 * @param boardId - The board ID
 * @param sprintId - The sprint ID
 * @param params - Optional query parameters (startAt, maxResults, etc.)
 * @returns Issues for the sprint in the board
 */
export const getBoardSprintIssues = async (
  boardId: number,
  sprintId: number,
  params: { startAt?: number; maxResults?: number } = {}
): Promise<GetSprintIssuesResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetSprintIssuesResponse>(
      format(jiraApiEndpoint.board.getBoardSprintIssues, boardId, sprintId),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getBoardSprintIssues executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      sprintId,
      params,
      endpoint: format(jiraApiEndpoint.board.getBoardSprintIssues, boardId, sprintId),
    };

    if (status === 400)
      throw new UserInputError('Invalid input for getBoardSprintIssues.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardSprintIssues.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for getBoardSprintIssues.', context);
    if (status === 404)
      throw new NotFoundError('Board or sprint not found for getBoardSprintIssues.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardSprintIssues.', context);
    throw new InternalServerError('Unexpected error in getBoardSprintIssues.', context);
  }
};

/**
 * Get versions for a board.
 * @param boardId - The board ID
 * @param params - Optional query parameters (startAt, maxResults, etc.)
 * @returns Versions for the board
 */
export const getBoardVersions = async (
  boardId: number,
  params: { startAt?: number; maxResults?: number } = {}
): Promise<GetBoardVersionsResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetBoardVersionsResponse>(
      format(jiraApiEndpoint.board.getBoardVersions, boardId),
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ getBoardVersions executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      boardId,
      params,
      endpoint: format(jiraApiEndpoint.board.getBoardVersions, boardId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getBoardVersions.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getBoardVersions.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getBoardVersions.', context);
    if (status === 404) throw new NotFoundError('Board not found for getBoardVersions.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getBoardVersions.', context);
    throw new InternalServerError('Unexpected error in getBoardVersions.', context);
  }
};
