// Ref: https://developer.atlassian.com/cloud/jira/software/rest/api-group-backlog/#api-group-backlog

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

export interface MoveToBacklogInput {
  issues: string[];
}

export interface MoveToBacklogForBoardInput {
  issues: string[];
  rankAfterIssue?: string;
  rankBeforeIssue?: string;
  rankCustomFieldId?: number;
}

/**
 * Move issues to the backlog. This operation is equivalent to remove future and active sprints from a given set of issues.
 * At most 50 issues may be moved at once.
 *
 * @param input - Object containing array of issue keys to move
 * @returns Promise that resolves when operation is successful
 * @throws UserInputError | AuthenticationError | ForbiddenError | NotFoundError | InternalServerError
 */
export const moveIssuesToBacklog = async (input: MoveToBacklogInput): Promise<void> => {
  try {
    await axiosClient.post(jiraApiEndpoint.backlog.moveIssuesToBacklog, input);
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, input, endpoint: jiraApiEndpoint.backlog.moveIssuesToBacklog };

    if (status === 400)
      throw new UserInputError('Invalid input for moving issues to backlog.', context);
    if (status === 401)
      throw new AuthenticationError(
        'Authentication failed when moving issues to backlog.',
        context
      );
    if (status === 403)
      throw new ForbiddenError('Access forbidden when moving issues to backlog.', context);
    if (status === 404)
      throw new NotFoundError('Resource not found when moving issues to backlog.', context);
    if (status && status >= 500)
      throw new InternalServerError(
        'Internal server error when moving issues to backlog.',
        context
      );
    throw new InternalServerError('Unexpected error when moving issues to backlog.', context);
  }
};

/**
 * Move issues to the backlog of a particular board (if they are already on that board).
 * This operation is equivalent to remove future and active sprints from a given set of issues if the board has sprints.
 * If the board does not have sprints this will put the issues back into the backlog from the board.
 * At most 50 issues may be moved at once.
 *
 * @param boardId - The ID of the board
 * @param input - Object containing issues array and optional ranking parameters
 * @returns Promise that resolves when operation is successful
 * @throws UserInputError | AuthenticationError | ForbiddenError | NotFoundError | InternalServerError
 */
export const moveIssuesToBacklogForBoard = async (
  boardId: number,
  input: MoveToBacklogForBoardInput
): Promise<void> => {
  try {
    await axiosClient.post(
      format(jiraApiEndpoint.backlog.moveIssuesToBacklogForBoard, boardId),
      input
    );
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      input,
      boardId,
      endpoint: format(jiraApiEndpoint.backlog.moveIssuesToBacklogForBoard, boardId),
    };

    if (status === 400)
      throw new UserInputError('Invalid input for moving issues to backlog for board.', context);
    if (status === 401)
      throw new AuthenticationError(
        'Authentication failed when moving issues to backlog for board.',
        context
      );
    if (status === 403)
      throw new ForbiddenError(
        'Access forbidden when moving issues to backlog for board.',
        context
      );
    if (status === 404)
      throw new NotFoundError(
        'Resource not found when moving issues to backlog for board.',
        context
      );
    if (status && status >= 500)
      throw new InternalServerError(
        'Internal server error when moving issues to backlog for board.',
        context
      );
    throw new InternalServerError(
      'Unexpected error when moving issues to backlog for board.',
      context
    );
  }
};
