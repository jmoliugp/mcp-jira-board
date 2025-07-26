// Ref: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post

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

const log = new Logger('jira/issue');

/**
 * Convert plain text to Atlassian Document Format (ADF)
 * @param text - Plain text to convert
 * @returns ADF formatted document
 */
function textToAtlassianDocument(text: string): AtlassianDocumentContent {
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      },
    ],
  };
}

export interface IssueType {
  self: string;
  id: string;
  description: string;
  iconUrl: string;
  name: string;
  subtask: boolean;
  avatarId: number;
  hierarchyLevel: number;
}

export interface AtlassianDocumentContent {
  type: 'doc';
  version: number;
  content: Array<{
    type: 'paragraph';
    content: Array<{
      type: 'text';
      text: string;
    }>;
  }>;
}

export interface IssueField {
  summary: string;
  description?: string | AtlassianDocumentContent;
  project: {
    key: string;
  };
  issuetype: {
    id: string;
  };
  assignee?: {
    accountId: string;
  };
  reporter?: {
    accountId: string;
  };
  priority?: {
    id: string;
  };
  labels?: string[];
  components?: Array<{
    id: string;
  }>;
  fixVersions?: Array<{
    id: string;
  }>;
  customfield_10016?: number; // Story Points
  customfield_10014?: string; // Sprint
  [key: string]: any; // Allow for custom fields
}

export interface CreateIssueInput {
  fields: IssueField;
}

export interface CreateIssueResponse {
  id: string;
  key: string;
  self: string;
}

export interface Issue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string;
    project: {
      id: string;
      key: string;
      name: string;
    };
    issuetype: IssueType;
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    reporter?: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    priority?: {
      id: string;
      name: string;
    };
    status: {
      id: string;
      name: string;
      statusCategory: {
        id: number;
        key: string;
        colorName: string;
      };
    };
    labels: string[];
    components: Array<{
      id: string;
      name: string;
    }>;
    fixVersions: Array<{
      id: string;
      name: string;
    }>;
    created: string;
    updated: string;
    [key: string]: any;
  };
}

export interface SearchIssuesParams {
  jql?: string;
  startAt?: number;
  maxResults?: number;
  validateQuery?: boolean;
  fields?: string[];
  expand?: string[];
  properties?: string[];
  fieldsByKeys?: boolean;
}

export interface SearchIssuesResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: Issue[];
}

export interface GetIssueTypesResponse {
  values: IssueType[];
}

/**
 * Get all issue types available in Jira.
 * @returns List of issue types
 */
export const getIssueTypes = async (): Promise<GetIssueTypesResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<IssueType[]>(jiraApiEndpoint.issue.getIssueTypes);

    const end = performance.now();
    log.info(`⏱️ getIssueTypes executed in ${(end - start).toFixed(2)}ms`);

    return { values: data };
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, endpoint: jiraApiEndpoint.issue.getIssueTypes };

    if (status === 400) throw new UserInputError('Invalid input for getIssueTypes.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getIssueTypes.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getIssueTypes.', context);
    if (status === 404) throw new NotFoundError('Resource not found for getIssueTypes.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getIssueTypes.', context);
    throw new InternalServerError('Unexpected error in getIssueTypes.', context);
  }
};

/**
 * Create a new issue (including user stories).
 * @param input - Issue creation data
 * @returns The created issue
 */
export const createIssue = async (input: CreateIssueInput): Promise<CreateIssueResponse> => {
  const start = performance.now();

  // Validate required fields according to Jira API documentation (before API call)
  if (!input.fields.summary || input.fields.summary.trim().length === 0) {
    throw new UserInputError('Summary is required and cannot be empty.');
  }

  // Validate summary length (Jira typically has a limit around 255 characters)
  if (input.fields.summary.length > 255) {
    throw new UserInputError('Summary cannot exceed 255 characters.');
  }

  if (!input.fields.project?.key) {
    throw new UserInputError('Project key is required.');
  }

  if (!input.fields.issuetype?.id) {
    throw new UserInputError('Issue type ID is required.');
  }

  try {
    // Convert plain text description to ADF format if needed
    const processedInput = { ...input };
    if (
      processedInput.fields.description &&
      typeof processedInput.fields.description === 'string'
    ) {
      processedInput.fields.description = textToAtlassianDocument(
        processedInput.fields.description
      );
    }

    const { data } = await axiosClient.post<CreateIssueResponse>(
      jiraApiEndpoint.issue.createIssue,
      processedInput
    );

    const end = performance.now();
    log.info(`⏱️ createIssue executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, input, endpoint: jiraApiEndpoint.issue.createIssue };

    if (status === 400) throw new UserInputError('Invalid input for createIssue.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for createIssue.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for createIssue.', context);
    if (status === 404) throw new NotFoundError('Resource not found for createIssue.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in createIssue.', context);
    throw new InternalServerError('Unexpected error in createIssue.', context);
  }
};

/**
 * Get issue details by issue key or ID.
 * @param issueKeyOrId - The issue key (e.g., "PROJ-123") or ID
 * @param expand - Optional fields to expand
 * @returns Issue details
 */
export const getIssue = async (issueKeyOrId: string, expand?: string): Promise<Issue> => {
  const start = performance.now();
  try {
    const params = expand ? { expand } : undefined;
    const { data } = await axiosClient.get<Issue>(
      format(jiraApiEndpoint.issue.getIssue, issueKeyOrId),
      { params }
    );

    const end = performance.now();
    log.info(`⏱️ getIssue executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      issueKeyOrId,
      expand,
      endpoint: format(jiraApiEndpoint.issue.getIssue, issueKeyOrId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getIssue.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getIssue.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getIssue.', context);
    if (status === 404) throw new NotFoundError('Issue not found for getIssue.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getIssue.', context);
    throw new InternalServerError('Unexpected error in getIssue.', context);
  }
};

/**
 * Search for issues using JQL.
 * @param params - Search parameters including JQL query
 * @returns Search results with issues
 */
export const searchIssues = async (params: SearchIssuesParams): Promise<SearchIssuesResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.post<SearchIssuesResponse>(
      jiraApiEndpoint.issue.searchIssues,
      params
    );

    const end = performance.now();
    log.info(`⏱️ searchIssues executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, params, endpoint: jiraApiEndpoint.issue.searchIssues };

    if (status === 400) throw new UserInputError('Invalid input for searchIssues.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for searchIssues.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for searchIssues.', context);
    if (status === 404) throw new NotFoundError('Resource not found for searchIssues.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in searchIssues.', context);
    throw new InternalServerError('Unexpected error in searchIssues.', context);
  }
};

/**
 * Create a user story in a project.
 * This is a convenience function that creates an issue with the "Story" issue type.
 * @param projectKey - The project key where to create the story
 * @param summary - The story summary/title
 * @param description - Optional story description
 * @param assigneeAccountId - Optional assignee account ID
 * @param storyPoints - Optional story points
 * @param labels - Optional labels
 * @returns The created user story
 */
export const createUserStory = async (
  projectKey: string,
  summary: string,
  description?: string,
  assigneeAccountId?: string,
  storyPoints?: number,
  labels?: string[]
): Promise<CreateIssueResponse> => {
  const start = performance.now();
  try {
    // First, get issue types to find the Story type ID
    const issueTypes = await getIssueTypes();
    const storyType = issueTypes.values.find(type => type.name.toLowerCase() === 'story');

    if (!storyType) {
      throw new UserInputError('Story issue type not found in Jira instance.', {
        availableTypes: issueTypes.values.map(t => t.name),
      });
    }

    const fields: IssueField = {
      summary,
      project: {
        key: projectKey,
      },
      issuetype: {
        id: storyType.id,
      },
    };

    if (description) {
      fields.description = description;
    }

    if (assigneeAccountId) {
      fields.assignee = {
        accountId: assigneeAccountId,
      };
    }

    if (storyPoints !== undefined) {
      fields.customfield_10016 = storyPoints; // Story Points field
    }

    if (labels && labels.length > 0) {
      fields.labels = labels;
    }

    const result = await createIssue({ fields });

    const end = performance.now();
    log.info(`⏱️ createUserStory executed in ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    // If it's already a UserInputError (from getIssueTypes), re-throw it
    if (error instanceof UserInputError) {
      throw error;
    }

    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      projectKey,
      summary,
      description,
      assigneeAccountId,
      storyPoints,
      labels,
    };

    if (status === 400) throw new UserInputError('Invalid input for createUserStory.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for createUserStory.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for createUserStory.', context);
    if (status === 404) throw new NotFoundError('Resource not found for createUserStory.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in createUserStory.', context);
    throw new InternalServerError('Unexpected error in createUserStory.', context);
  }
};

/**
 * Create a bug in a project.
 * This is a convenience function that creates an issue with the "Bug" issue type.
 * @param projectKey - The project key where to create the bug
 * @param summary - The bug summary/title
 * @param description - Optional bug description
 * @param assigneeAccountId - Optional assignee account ID
 * @param priority - Optional priority ID
 * @param labels - Optional labels
 * @returns The created bug
 */
export const createBug = async (
  projectKey: string,
  summary: string,
  description?: string,
  assigneeAccountId?: string,
  priority?: string,
  labels?: string[]
): Promise<CreateIssueResponse> => {
  const start = performance.now();
  try {
    // First, get issue types to find the Bug type ID
    const issueTypes = await getIssueTypes();
    const bugType = issueTypes.values.find(type => type.name.toLowerCase() === 'bug');

    if (!bugType) {
      throw new UserInputError('Bug issue type not found in Jira instance.', {
        availableTypes: issueTypes.values.map(t => t.name),
      });
    }

    const fields: IssueField = {
      summary,
      project: {
        key: projectKey,
      },
      issuetype: {
        id: bugType.id,
      },
    };

    if (description) {
      fields.description = description;
    }

    if (assigneeAccountId) {
      fields.assignee = {
        accountId: assigneeAccountId,
      };
    }

    if (priority) {
      fields.priority = {
        id: priority,
      };
    }

    if (labels && labels.length > 0) {
      fields.labels = labels;
    }

    const result = await createIssue({ fields });

    const end = performance.now();
    log.info(`⏱️ createBug executed in ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    // If it's already a UserInputError (from getIssueTypes), re-throw it
    if (error instanceof UserInputError) {
      throw error;
    }

    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      projectKey,
      summary,
      description,
      assigneeAccountId,
      priority,
      labels,
    };

    if (status === 400) throw new UserInputError('Invalid input for createBug.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for createBug.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for createBug.', context);
    if (status === 404) throw new NotFoundError('Resource not found for createBug.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in createBug.', context);
    throw new InternalServerError('Unexpected error in createBug.', context);
  }
};
