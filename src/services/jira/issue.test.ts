import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as issue from './issue.js';
import { axiosClient } from './networking.js';
import {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from '../../utils/error.js';
import { AxiosError } from 'axios';

// Mock the axios client
vi.mock('./networking.js', () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  jiraApiEndpoint: {
    issue: {
      getIssueTypes: '/rest/api/3/issuetype',
      createIssue: '/rest/api/3/issue',
      getIssue: '/rest/api/3/issue/%s',
      deleteIssue: '/rest/api/3/issue/%s',
      searchIssues: '/rest/api/3/search',
    },
  },
}));

const mockedAxiosClient = vi.mocked(axiosClient) as any;

// Mock data
const mockIssueType: issue.IssueType = {
  self: 'https://your-domain.atlassian.net/rest/api/3/issuetype/10001',
  id: '10001',
  description: 'A user story',
  iconUrl: 'https://your-domain.atlassian.net/images/icons/issuetypes/story.svg',
  name: 'Story',
  subtask: false,
  avatarId: 10315,
  hierarchyLevel: 0,
};

const mockIssueTypes = {
  values: [
    mockIssueType,
    {
      ...mockIssueType,
      id: '10002',
      name: 'Bug',
      description: 'A bug',
    },
    {
      ...mockIssueType,
      id: '10003',
      name: 'Task',
      description: 'A task',
    },
  ],
};

const mockCreateIssueResponse: issue.CreateIssueResponse = {
  id: '10001',
  key: 'PROJ-123',
  self: 'https://your-domain.atlassian.net/rest/api/3/issue/10001',
};

const mockIssue: issue.Issue = {
  id: '10001',
  key: 'PROJ-123',
  self: 'https://your-domain.atlassian.net/rest/api/3/issue/10001',
  fields: {
    summary: 'Test User Story',
    description: 'This is a test user story',
    project: {
      id: '10000',
      key: 'PROJ',
      name: 'Test Project',
    },
    issuetype: mockIssueType,
    status: {
      id: '10000',
      name: 'To Do',
      statusCategory: {
        id: 2,
        key: 'new',
        colorName: 'blue-gray',
      },
    },
    labels: ['test', 'story'],
    components: [],
    fixVersions: [],
    created: '2023-01-01T00:00:00.000Z',
    updated: '2023-01-01T00:00:00.000Z',
  },
};

const mockSearchResponse: issue.SearchIssuesResponse = {
  expand: 'names,schema',
  startAt: 0,
  maxResults: 50,
  total: 1,
  issues: [mockIssue],
};

// Helper function to create AxiosError
const makeAxiosError = (status: number, data?: any): AxiosError => {
  const error = new AxiosError();
  error.response = {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as any,
  };
  return error;
};

describe('Issue Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getIssueTypes', () => {
    it('should resolve on success', async () => {
      // Mock the API returning an array directly (as it actually does)
      const apiResponse = mockIssueTypes.values;
      mockedAxiosClient.get.mockResolvedValueOnce({ data: apiResponse });

      const result = await issue.getIssueTypes();

      // Should return the wrapped format for consistency
      expect(result).toEqual(mockIssueTypes);
      expect(mockedAxiosClient.get).toHaveBeenCalledWith('/rest/api/3/issuetype');
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(400));
      await expect(issue.getIssueTypes()).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(401));
      await expect(issue.getIssueTypes()).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(403));
      await expect(issue.getIssueTypes()).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(404));
      await expect(issue.getIssueTypes()).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(500));
      await expect(issue.getIssueTypes()).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('createIssue', () => {
    const createIssueInput: issue.CreateIssueInput = {
      fields: {
        summary: 'Test Issue',
        project: {
          key: 'PROJ',
        },
        issuetype: {
          id: '10001',
        },
      },
    };

    it('should resolve on success', async () => {
      mockedAxiosClient.post.mockResolvedValueOnce({ data: mockCreateIssueResponse });
      await expect(issue.createIssue(createIssueInput)).resolves.toEqual(mockCreateIssueResponse);
    });

    it('should convert plain text description to ADF format', async () => {
      const inputWithTextDescription: issue.CreateIssueInput = {
        fields: {
          ...createIssueInput.fields,
          description: 'This is a plain text description',
        },
      };

      mockedAxiosClient.post.mockResolvedValueOnce({ data: mockCreateIssueResponse });

      await issue.createIssue(inputWithTextDescription);

      expect(mockedAxiosClient.post).toHaveBeenCalledWith(
        '/rest/api/3/issue',
        expect.objectContaining({
          fields: expect.objectContaining({
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'This is a plain text description',
                    },
                  ],
                },
              ],
            },
          }),
        })
      );
    });

    it('should not convert ADF description', async () => {
      const adfDescription: issue.AtlassianDocumentContent = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This is already in ADF format',
              },
            ],
          },
        ],
      };

      const inputWithADFDescription: issue.CreateIssueInput = {
        fields: {
          ...createIssueInput.fields,
          description: adfDescription,
        },
      };

      mockedAxiosClient.post.mockResolvedValueOnce({ data: mockCreateIssueResponse });

      await issue.createIssue(inputWithADFDescription);

      expect(mockedAxiosClient.post).toHaveBeenCalledWith(
        '/rest/api/3/issue',
        expect.objectContaining({
          fields: expect.objectContaining({
            description: adfDescription,
          }),
        })
      );
    });

    it('should validate required fields - missing summary', async () => {
      const invalidInput: any = {
        fields: {
          project: { key: 'PROJ' },
          issuetype: { id: '10001' },
        },
      };

      await expect(issue.createIssue(invalidInput)).rejects.toBeInstanceOf(UserInputError);
      await expect(issue.createIssue(invalidInput)).rejects.toThrow(
        'Summary is required and cannot be empty.'
      );
    });

    it('should validate required fields - empty summary', async () => {
      const invalidInput: issue.CreateIssueInput = {
        fields: {
          summary: '',
          project: { key: 'PROJ' },
          issuetype: { id: '10001' },
        },
      };

      await expect(issue.createIssue(invalidInput)).rejects.toBeInstanceOf(UserInputError);
      await expect(issue.createIssue(invalidInput)).rejects.toThrow(
        'Summary is required and cannot be empty.'
      );
    });

    it('should validate required fields - missing project key', async () => {
      const invalidInput: any = {
        fields: {
          summary: 'Test Issue',
          issuetype: { id: '10001' },
        },
      };

      await expect(issue.createIssue(invalidInput)).rejects.toBeInstanceOf(UserInputError);
      await expect(issue.createIssue(invalidInput)).rejects.toThrow('Project key is required.');
    });

    it('should validate required fields - missing issue type ID', async () => {
      const invalidInput: any = {
        fields: {
          summary: 'Test Issue',
          project: { key: 'PROJ' },
        },
      };

      await expect(issue.createIssue(invalidInput)).rejects.toBeInstanceOf(UserInputError);
      await expect(issue.createIssue(invalidInput)).rejects.toThrow('Issue type ID is required.');
    });

    it('should validate summary length', async () => {
      const longSummary = 'A'.repeat(256); // 256 characters, exceeding the 255 limit
      const invalidInput: issue.CreateIssueInput = {
        fields: {
          summary: longSummary,
          project: { key: 'PROJ' },
          issuetype: { id: '10001' },
        },
      };

      await expect(issue.createIssue(invalidInput)).rejects.toBeInstanceOf(UserInputError);
      await expect(issue.createIssue(invalidInput)).rejects.toThrow(
        'Summary cannot exceed 255 characters.'
      );
    });

    it('should handle complex fields correctly', async () => {
      const complexInput: issue.CreateIssueInput = {
        fields: {
          summary: 'Complex Test Issue',
          project: { key: 'PROJ' },
          issuetype: { id: '10001' },
          description: 'Complex description with special chars: áéíóúñ 🚀✨',
          assignee: { accountId: 'user123' },
          reporter: { accountId: 'user456' },
          priority: { id: '10001' },
          labels: ['test', 'complex', 'validation'],
          components: [{ id: '10001' }, { id: '10002' }],
          fixVersions: [{ id: '10001' }],
        },
      };

      mockedAxiosClient.post.mockResolvedValueOnce({ data: mockCreateIssueResponse });

      await issue.createIssue(complexInput);

      expect(mockedAxiosClient.post).toHaveBeenCalledWith(
        '/rest/api/3/issue',
        expect.objectContaining({
          fields: expect.objectContaining({
            summary: 'Complex Test Issue',
            project: { key: 'PROJ' },
            issuetype: { id: '10001' },
            description: expect.objectContaining({
              type: 'doc',
              version: 1,
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'paragraph',
                  content: expect.arrayContaining([
                    expect.objectContaining({
                      type: 'text',
                      text: 'Complex description with special chars: áéíóúñ 🚀✨',
                    }),
                  ]),
                }),
              ]),
            }),
            assignee: { accountId: 'user123' },
            reporter: { accountId: 'user456' },
            priority: { id: '10001' },
            labels: ['test', 'complex', 'validation'],
            components: [{ id: '10001' }, { id: '10002' }],
            fixVersions: [{ id: '10001' }],
          }),
        })
      );
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(400));
      await expect(issue.createIssue(createIssueInput)).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(401));
      await expect(issue.createIssue(createIssueInput)).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(403));
      await expect(issue.createIssue(createIssueInput)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(404));
      await expect(issue.createIssue(createIssueInput)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(500));
      await expect(issue.createIssue(createIssueInput)).rejects.toBeInstanceOf(InternalServerError);
    });

    it('should handle scope restriction errors with detailed context', async () => {
      const scopeErrorData = {
        errorMessages: [],
        errors: {
          issuetype: 'The issue type selected is invalid.',
        },
      };

      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(400, scopeErrorData));

      try {
        await issue.createIssue(createIssueInput);
      } catch (error) {
        expect(error).toBeInstanceOf(UserInputError);
        expect((error as any).context?.data?.errors?.issuetype).toBe(
          'The issue type selected is invalid.'
        );
      }
    });

    it('should handle ADF format errors with detailed context', async () => {
      const adfErrorData = {
        errorMessages: [],
        errors: {
          description:
            'Operation value must be an Atlassian Document (see the Atlassian Document Format)',
        },
      };

      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(400, adfErrorData));

      try {
        await issue.createIssue(createIssueInput);
      } catch (error) {
        expect(error).toBeInstanceOf(UserInputError);
        expect((error as any).context?.data?.errors?.description).toContain('Atlassian Document');
      }
    });
  });

  describe('getIssue', () => {
    it('should resolve on success', async () => {
      mockedAxiosClient.get.mockResolvedValueOnce({ data: mockIssue });
      await expect(issue.getIssue('PROJ-123')).resolves.toEqual(mockIssue);
    });

    it('should resolve on success with expand', async () => {
      mockedAxiosClient.get.mockResolvedValueOnce({ data: mockIssue });
      await expect(issue.getIssue('PROJ-123', 'renderedFields')).resolves.toEqual(mockIssue);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(404));
      await expect(issue.getIssue('PROJ-999')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('searchIssues', () => {
    const searchParams: issue.SearchIssuesParams = {
      jql: 'project = PROJ',
      maxResults: 10,
    };

    it('should resolve on success', async () => {
      mockedAxiosClient.post.mockResolvedValueOnce({ data: mockSearchResponse });
      await expect(issue.searchIssues(searchParams)).resolves.toEqual(mockSearchResponse);
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(400));
      await expect(issue.searchIssues(searchParams)).rejects.toBeInstanceOf(UserInputError);
    });
  });

  describe('deleteIssue', () => {
    it('should resolve on success', async () => {
      mockedAxiosClient.delete.mockResolvedValueOnce({ data: undefined });
      await expect(issue.deleteIssue('PROJ-123')).resolves.toBeUndefined();
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxiosClient.delete.mockRejectedValueOnce(makeAxiosError(400));
      await expect(issue.deleteIssue('PROJ-123')).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxiosClient.delete.mockRejectedValueOnce(makeAxiosError(401));
      await expect(issue.deleteIssue('PROJ-123')).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxiosClient.delete.mockRejectedValueOnce(makeAxiosError(403));
      await expect(issue.deleteIssue('PROJ-123')).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxiosClient.delete.mockRejectedValueOnce(makeAxiosError(404));
      await expect(issue.deleteIssue('PROJ-999')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxiosClient.delete.mockRejectedValueOnce(makeAxiosError(500));
      await expect(issue.deleteIssue('PROJ-123')).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('createUserStory', () => {
    it('should create a user story successfully', async () => {
      // Mock the API returning an array directly (as it actually does)
      const apiResponse = mockIssueTypes.values;
      mockedAxiosClient.get.mockResolvedValueOnce({ data: apiResponse });
      mockedAxiosClient.post.mockResolvedValueOnce({ data: mockCreateIssueResponse });

      const result = await issue.createUserStory(
        'PROJ',
        'Test User Story',
        'This is a test story',
        'user123',
        5,
        ['test', 'story']
      );

      expect(result).toEqual(mockCreateIssueResponse);
      expect(mockedAxiosClient.post).toHaveBeenCalledWith(
        '/rest/api/3/issue',
        expect.objectContaining({
          fields: expect.objectContaining({
            summary: 'Test User Story',
            project: { key: 'PROJ' },
            issuetype: { id: '10001' },
            description: expect.objectContaining({
              type: 'doc',
              version: 1,
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'paragraph',
                  content: expect.arrayContaining([
                    expect.objectContaining({
                      type: 'text',
                      text: 'This is a test story',
                    }),
                  ]),
                }),
              ]),
            }),
            assignee: { accountId: 'user123' },
            customfield_10016: 5,
            labels: ['test', 'story'],
          }),
        })
      );
    });

    it('should create a user story with the specific issue type ID that works in our tests', async () => {
      // Mock issue types including the specific ID "10035" that we know works
      const issueTypesWithTask35 = {
        values: [
          {
            ...mockIssueType,
            id: '10035',
            name: 'Task',
            description: 'A small, distinct piece of work.',
          },
          mockIssueType, // Story type
        ],
      };

      const apiResponse = issueTypesWithTask35.values;
      mockedAxiosClient.get.mockResolvedValueOnce({ data: apiResponse });
      mockedAxiosClient.post.mockResolvedValueOnce({ data: mockCreateIssueResponse });

      const result = await issue.createUserStory(
        'FITPULSE',
        'Technical Foundation Setup',
        'This is a test user story for technical foundation',
        undefined,
        undefined,
        ['technical', 'foundation']
      );

      expect(result).toEqual(mockCreateIssueResponse);
      expect(mockedAxiosClient.post).toHaveBeenCalledWith(
        '/rest/api/3/issue',
        expect.objectContaining({
          fields: expect.objectContaining({
            summary: 'Technical Foundation Setup',
            project: { key: 'FITPULSE' },
            issuetype: { id: '10001' }, // Should still use Story type
            description: expect.objectContaining({
              type: 'doc',
              version: 1,
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'paragraph',
                  content: expect.arrayContaining([
                    expect.objectContaining({
                      type: 'text',
                      text: 'This is a test user story for technical foundation',
                    }),
                  ]),
                }),
              ]),
            }),
            labels: ['technical', 'foundation'],
          }),
        })
      );
    });

    it('should throw error when Story issue type not found', async () => {
      const issueTypesWithoutStory = {
        values: [
          {
            ...mockIssueType,
            id: '10002',
            name: 'Bug',
          },
        ],
      };

      // Mock the API returning an array directly (as it actually does)
      const apiResponse = issueTypesWithoutStory.values;
      mockedAxiosClient.get.mockResolvedValueOnce({ data: apiResponse });

      await expect(issue.createUserStory('PROJ', 'Test Story')).rejects.toBeInstanceOf(
        UserInputError
      );
    });
  });

  describe('createBug', () => {
    it('should create a bug successfully', async () => {
      // Mock the API returning an array directly (as it actually does)
      const apiResponse = mockIssueTypes.values;
      mockedAxiosClient.get.mockResolvedValueOnce({ data: apiResponse });
      mockedAxiosClient.post.mockResolvedValueOnce({ data: mockCreateIssueResponse });

      const result = await issue.createBug(
        'PROJ',
        'Test Bug',
        'This is a test bug',
        'user123',
        '10001',
        ['bug', 'critical']
      );

      expect(result).toEqual(mockCreateIssueResponse);
      expect(mockedAxiosClient.post).toHaveBeenCalledWith(
        '/rest/api/3/issue',
        expect.objectContaining({
          fields: expect.objectContaining({
            summary: 'Test Bug',
            project: { key: 'PROJ' },
            issuetype: { id: '10002' },
            description: expect.objectContaining({
              type: 'doc',
              version: 1,
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'paragraph',
                  content: expect.arrayContaining([
                    expect.objectContaining({
                      type: 'text',
                      text: 'This is a test bug',
                    }),
                  ]),
                }),
              ]),
            }),
            assignee: { accountId: 'user123' },
            priority: { id: '10001' },
            labels: ['bug', 'critical'],
          }),
        })
      );
    });

    it('should throw error when Bug issue type not found', async () => {
      const issueTypesWithoutBug = {
        values: [
          {
            ...mockIssueType,
            id: '10001',
            name: 'Story',
          },
        ],
      };

      // Mock the API returning an array directly (as it actually does)
      const apiResponse = issueTypesWithoutBug.values;
      mockedAxiosClient.get.mockResolvedValueOnce({ data: apiResponse });

      await expect(issue.createBug('PROJ', 'Test Bug')).rejects.toBeInstanceOf(UserInputError);
    });
  });
});

describe('Issue Update Functions', () => {
  describe('getIssueTransitions', () => {
    it('should get issue transitions successfully', async () => {
      const mockTransitions = {
        expand: 'transitions',
        transitions: [
          {
            id: '21',
            name: 'In Progress',
            to: {
              id: '3',
              name: 'In Progress',
              statusCategory: {
                id: 4,
                key: 'indeterminate',
                colorName: 'yellow',
              },
            },
            hasScreen: false,
            isGlobal: true,
            isInitial: false,
            isConditional: false,
            isLooped: false,
          },
        ],
      };

      mockedAxiosClient.get.mockResolvedValueOnce({ data: mockTransitions });

      const result = await issue.getIssueTransitions('TEST-123');

      expect(result).toEqual(mockTransitions);
      expect(mockedAxiosClient.get).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue/TEST-123/transitions'
      );
    });

    it('should handle errors properly', async () => {
      const error = new Error('API Error') as AxiosError;
      error.response = { status: 404, data: { errorMessages: ['Issue not found'] } } as any;
      mockedAxiosClient.get.mockRejectedValueOnce(error);

      await expect(issue.getIssueTransitions('INVALID-123')).rejects.toThrow(
        'Issue not found for getIssueTransitions.'
      );
    });
  });

  describe('updateIssue', () => {
    it('should update issue fields successfully', async () => {
      const mockResponse = {
        id: '12345',
        key: 'TEST-123',
        self: 'https://test.atlassian.net/rest/api/3/issue/12345',
      };

      const updateInput = {
        fields: {
          summary: 'Updated Summary',
          assignee: {
            accountId: 'user123',
          },
          priority: {
            id: '2',
          },
        },
      };

      mockedAxiosClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await issue.updateIssue('TEST-123', updateInput);

      expect(result).toEqual(mockResponse);
      expect(mockedAxiosClient.put).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue/TEST-123',
        updateInput
      );
    });

    it('should update issue status with transition', async () => {
      const mockResponse = {
        id: '12345',
        key: 'TEST-123',
        self: 'https://test.atlassian.net/rest/api/3/issue/12345',
      };

      const updateInput = {
        transition: {
          id: '21',
        },
        update: {
          comment: [
            {
              add: {
                body: {
                  type: 'doc' as const,
                  version: 1,
                  content: [
                    {
                      type: 'paragraph' as const,
                      content: [
                        {
                          type: 'text' as const,
                          text: 'Status updated to In Progress',
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      };

      mockedAxiosClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await issue.updateIssue('TEST-123', updateInput);

      expect(result).toEqual(mockResponse);
    });

    it('should unassign issue when assignee is null', async () => {
      const mockResponse = {
        id: '12345',
        key: 'TEST-123',
        self: 'https://test.atlassian.net/rest/api/3/issue/12345',
      };

      const updateInput = {
        fields: {
          assignee: null,
        },
      };

      mockedAxiosClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await issue.updateIssue('TEST-123', updateInput);

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when no update operation is provided', async () => {
      await expect(issue.updateIssue('TEST-123', {})).rejects.toThrow(
        'At least one update operation (fields, transition, or update) is required.'
      );
    });

    it('should handle API errors properly', async () => {
      const error = new Error('API Error') as AxiosError;
      error.response = { status: 400, data: { errorMessages: ['Invalid transition'] } } as any;
      mockedAxiosClient.put.mockRejectedValueOnce(error);

      const updateInput = {
        transition: {
          id: 'invalid',
        },
      };

      await expect(issue.updateIssue('TEST-123', updateInput)).rejects.toThrow(
        'Invalid input for updateIssue.'
      );
    });
  });
});
