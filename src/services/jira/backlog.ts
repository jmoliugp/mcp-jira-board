// Ref: https://developer.atlassian.com/cloud/jira/software/rest/api-group-backlog/#api-group-backlog

// TODO: Handle response errors.

import { format } from 'util';
import { axiosClient, jiraApiEndpoint } from './networking';

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
 */
export const moveIssuesToBacklog = async (input: MoveToBacklogInput): Promise<void> => {
  await axiosClient.post(jiraApiEndpoint.backlog.moveIssuesToBacklog, input);
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
 */
export const moveIssuesToBacklogForBoard = async (
  boardId: number,
  input: MoveToBacklogForBoardInput
): Promise<void> => {
  await axiosClient.post(
    format(jiraApiEndpoint.backlog.moveIssuesToBacklogForBoard, boardId),
    input
  );
};
