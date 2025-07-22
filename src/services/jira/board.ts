// Ref: https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/#api-group-board

import { format } from 'util';
import { axiosClient, jiraApiEndpoint } from './networking';
import {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from '../../utils/error';
import { AxiosError } from 'axios';
import { performance } from 'perf_hooks';
import { Logger } from '../../utils/log';

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
  // Add more fields as needed from the API response
}

export interface BoardBacklogIssue {
  id: string;
  key: string;
  // Puedes agregar más campos según la respuesta real de la API
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
