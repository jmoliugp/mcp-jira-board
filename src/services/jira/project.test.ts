import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as project from './project.js';
import {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from '../../utils/error.js';

// Mock axios
vi.mock('axios');

// Mock the axios client
vi.mock('./networking.js', () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  jiraApiEndpoint: {
    project: {
      createProject: '/rest/api/3/project',
      getAllProjects: '/rest/api/3/project',
      getProject: '/rest/api/3/project/%s',
      updateProject: '/rest/api/3/project/%s',
      deleteProject: '/rest/api/3/project/%s',
    },
    user: {
      getCurrentUser: '/rest/api/3/myself',
    },
  },
}));

import { axiosClient, jiraApiEndpoint } from './networking.js';
const mockedAxiosClient = vi.mocked(axiosClient) as any;

describe('Project Service', () => {
  const projectKey = 'TEST';

  const mockProject = {
    id: '10001',
    key: 'TEST',
    name: 'Test Project',
    projectTypeKey: 'software',
    simplified: false,
    style: 'classic',
    isPrivate: false,
    description: 'A test project',
    url: 'https://example.atlassian.net/browse/TEST',
    assigneeType: 'PROJECT_LEAD',
    avatarUrls: {
      '16x16': 'https://example.atlassian.net/secure/projectavatar?size=xsmall&pid=10001',
      '24x24': 'https://example.atlassian.net/secure/projectavatar?size=small&pid=10001',
      '32x32': 'https://example.atlassian.net/secure/projectavatar?size=medium&pid=10001',
      '48x48': 'https://example.atlassian.net/secure/projectavatar?size=large&pid=10001',
    },
  };

  const mockProjectsResponse = {
    isLast: true,
    maxResults: 50,
    startAt: 0,
    total: 1,
    values: [mockProject],
  };

  const makeAxiosError = (status: number) => ({
    response: {
      status,
      data: { errorMessages: [`Error ${status}`] },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProject', () => {
    const createProjectInput = {
      key: 'TEST',
      name: 'Test Project',
      projectTypeKey: 'software' as const,
      description: 'A test project',
      leadAccountId: 'user123',
    };

    const mockCurrentUser = {
      accountId: 'user123',
      emailAddress: 'test@example.com',
      displayName: 'Test User',
      active: true,
      timeZone: 'UTC',
      accountType: 'atlassian',
    };

    beforeEach(() => {
      // Mock getCurrentUser for all createProject tests
      mockedAxiosClient.get.mockResolvedValueOnce({ data: mockCurrentUser });
    });

    it('should resolve on success', async () => {
      mockedAxiosClient.post.mockResolvedValueOnce({ data: mockProject });
      await expect(project.createProject(createProjectInput)).resolves.toEqual(mockProject);
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(400));
      await expect(project.createProject(createProjectInput)).rejects.toBeInstanceOf(
        UserInputError
      );
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(401));
      await expect(project.createProject(createProjectInput)).rejects.toBeInstanceOf(
        AuthenticationError
      );
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(403));
      await expect(project.createProject(createProjectInput)).rejects.toBeInstanceOf(
        ForbiddenError
      );
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(404));
      await expect(project.createProject(createProjectInput)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(500));
      await expect(project.createProject(createProjectInput)).rejects.toBeInstanceOf(
        InternalServerError
      );
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(new Error('Unknown'));
      await expect(project.createProject(createProjectInput)).rejects.toBeInstanceOf(
        InternalServerError
      );
    });
  });

  describe('getAllProjects', () => {
    it('should resolve on success', async () => {
      mockedAxiosClient.get.mockResolvedValueOnce({ data: mockProjectsResponse });
      await expect(project.getAllProjects()).resolves.toEqual(mockProjectsResponse);
    });

    it('should pass parameters correctly', async () => {
      mockedAxiosClient.get.mockResolvedValueOnce({ data: mockProjectsResponse });
      const params = { maxResults: 10, orderBy: 'name' as const };
      await project.getAllProjects(params);
      expect(mockedAxiosClient.get).toHaveBeenCalledWith(jiraApiEndpoint.project.getAllProjects, {
        params,
      });
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(400));
      await expect(project.getAllProjects()).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(401));
      await expect(project.getAllProjects()).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(403));
      await expect(project.getAllProjects()).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(404));
      await expect(project.getAllProjects()).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(500));
      await expect(project.getAllProjects()).rejects.toBeInstanceOf(InternalServerError);
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(new Error('Unknown'));
      await expect(project.getAllProjects()).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('getProject', () => {
    it('should resolve on success', async () => {
      mockedAxiosClient.get.mockResolvedValueOnce({ data: mockProject });
      await expect(project.getProject(projectKey)).resolves.toEqual(mockProject);
    });

    it('should pass expand parameter correctly', async () => {
      mockedAxiosClient.get.mockResolvedValueOnce({ data: mockProject });
      await project.getProject(projectKey, 'description,lead');
      expect(mockedAxiosClient.get).toHaveBeenCalledWith(
        jiraApiEndpoint.project.getProject.replace('%s', projectKey),
        { params: { expand: 'description,lead' } }
      );
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(400));
      await expect(project.getProject(projectKey)).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(401));
      await expect(project.getProject(projectKey)).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(403));
      await expect(project.getProject(projectKey)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(404));
      await expect(project.getProject(projectKey)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(makeAxiosError(500));
      await expect(project.getProject(projectKey)).rejects.toBeInstanceOf(InternalServerError);
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxiosClient.get.mockRejectedValueOnce(new Error('Unknown'));
      await expect(project.getProject(projectKey)).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('updateProject', () => {
    const updateProjectInput = {
      name: 'Updated Test Project',
      description: 'An updated test project',
    };

    it('should resolve on success', async () => {
      mockedAxiosClient.put.mockResolvedValueOnce({
        data: { ...mockProject, ...updateProjectInput },
      });
      await expect(project.updateProject(projectKey, updateProjectInput)).resolves.toEqual({
        ...mockProject,
        ...updateProjectInput,
      });
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxiosClient.put.mockRejectedValueOnce(makeAxiosError(400));
      await expect(project.updateProject(projectKey, updateProjectInput)).rejects.toBeInstanceOf(
        UserInputError
      );
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxiosClient.put.mockRejectedValueOnce(makeAxiosError(401));
      await expect(project.updateProject(projectKey, updateProjectInput)).rejects.toBeInstanceOf(
        AuthenticationError
      );
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxiosClient.put.mockRejectedValueOnce(makeAxiosError(403));
      await expect(project.updateProject(projectKey, updateProjectInput)).rejects.toBeInstanceOf(
        ForbiddenError
      );
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxiosClient.put.mockRejectedValueOnce(makeAxiosError(404));
      await expect(project.updateProject(projectKey, updateProjectInput)).rejects.toBeInstanceOf(
        NotFoundError
      );
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxiosClient.put.mockRejectedValueOnce(makeAxiosError(500));
      await expect(project.updateProject(projectKey, updateProjectInput)).rejects.toBeInstanceOf(
        InternalServerError
      );
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxiosClient.put.mockRejectedValueOnce(new Error('Unknown'));
      await expect(project.updateProject(projectKey, updateProjectInput)).rejects.toBeInstanceOf(
        InternalServerError
      );
    });
  });

  describe('deleteProject', () => {
    it('should resolve on success', async () => {
      mockedAxiosClient.delete.mockResolvedValueOnce({ data: undefined });
      await expect(project.deleteProject(projectKey)).resolves.toBeUndefined();
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxiosClient.delete.mockRejectedValueOnce(makeAxiosError(400));
      await expect(project.deleteProject(projectKey)).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxiosClient.delete.mockRejectedValueOnce(makeAxiosError(401));
      await expect(project.deleteProject(projectKey)).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxiosClient.delete.mockRejectedValueOnce(makeAxiosError(403));
      await expect(project.deleteProject(projectKey)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxiosClient.delete.mockRejectedValueOnce(makeAxiosError(404));
      await expect(project.deleteProject(projectKey)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxiosClient.delete.mockRejectedValueOnce(makeAxiosError(500));
      await expect(project.deleteProject(projectKey)).rejects.toBeInstanceOf(InternalServerError);
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxiosClient.delete.mockRejectedValueOnce(new Error('Unknown'));
      await expect(project.deleteProject(projectKey)).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('createProjectWithBoard', () => {
    const projectInput = {
      key: 'TEST',
      name: 'Test Project',
      projectTypeKey: 'software' as const,
      description: 'A test project',
    };

    const mockCurrentUser = {
      accountId: 'user123',
      emailAddress: 'test@example.com',
      displayName: 'Test User',
      active: true,
      timeZone: 'UTC',
      accountType: 'atlassian',
    };

    beforeEach(() => {
      // Mock getCurrentUser for all createProjectWithBoard tests
      mockedAxiosClient.get.mockResolvedValueOnce({ data: mockCurrentUser });
    });

    it('should create project successfully', async () => {
      mockedAxiosClient.post.mockResolvedValueOnce({ data: mockProject });
      const result = await project.createProjectWithBoard(projectInput, 'Test Board', 'scrum');
      expect(result.project).toEqual(mockProject);
    });

    it('should handle errors properly', async () => {
      mockedAxiosClient.post.mockRejectedValueOnce(makeAxiosError(400));
      await expect(
        project.createProjectWithBoard(projectInput, 'Test Board', 'scrum')
      ).rejects.toBeInstanceOf(InternalServerError);
    });
  });
});
