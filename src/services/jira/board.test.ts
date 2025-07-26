import { describe, it, expect, vi, afterEach } from 'vitest';
import * as board from './board.js';
import { axiosClient } from './networking.js';
import {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from '../../utils/error.js';

vi.mock('./networking.js', async () => {
  const actual = await vi.importActual<typeof import('./networking.js')>('./networking.js');
  return {
    ...actual,
    axiosClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const mockedAxios = axiosClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const boardId = 42;
const boardData = { id: boardId, name: 'Test Board', type: 'scrum', self: 'url' };
const getAllBoardsResponse = {
  isLast: true,
  maxResults: 50,
  startAt: 0,
  total: 1,
  values: [boardData],
};
const createBoardInput: board.CreateBoardInput = { name: 'Test Board', type: 'scrum', filterId: 1 };

function makeAxiosError(status: number, data: any = {}) {
  const err: any = new Error('Axios error');
  err.response = { status, data };
  return err;
}

describe('board service', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllBoards', () => {
    it('should resolve on success', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: getAllBoardsResponse });
      await expect(board.getAllBoards()).resolves.toEqual(getAllBoardsResponse);
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
      await expect(board.getAllBoards()).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
      await expect(board.getAllBoards()).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
      await expect(board.getAllBoards()).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
      await expect(board.getAllBoards()).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
      await expect(board.getAllBoards()).rejects.toBeInstanceOf(InternalServerError);
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
      await expect(board.getAllBoards()).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('createBoard', () => {
    it('should resolve on success', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: boardData });
      await expect(board.createBoard(createBoardInput)).resolves.toEqual(boardData);
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(400));
      await expect(board.createBoard(createBoardInput)).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(401));
      await expect(board.createBoard(createBoardInput)).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(403));
      await expect(board.createBoard(createBoardInput)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(404));
      await expect(board.createBoard(createBoardInput)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(500));
      await expect(board.createBoard(createBoardInput)).rejects.toBeInstanceOf(InternalServerError);
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Unknown'));
      await expect(board.createBoard(createBoardInput)).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('getBoardById', () => {
    it('should resolve on success', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: boardData });
      await expect(board.getBoardById(boardId)).resolves.toEqual(boardData);
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
      await expect(board.getBoardById(boardId)).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
      await expect(board.getBoardById(boardId)).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
      await expect(board.getBoardById(boardId)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
      await expect(board.getBoardById(boardId)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
      await expect(board.getBoardById(boardId)).rejects.toBeInstanceOf(InternalServerError);
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
      await expect(board.getBoardById(boardId)).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('deleteBoard', () => {
    it('should resolve on success', async () => {
      mockedAxios.delete.mockResolvedValueOnce({});
      await expect(board.deleteBoard(boardId)).resolves.toBeUndefined();
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxios.delete.mockRejectedValueOnce(makeAxiosError(400));
      await expect(board.deleteBoard(boardId)).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxios.delete.mockRejectedValueOnce(makeAxiosError(401));
      await expect(board.deleteBoard(boardId)).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxios.delete.mockRejectedValueOnce(makeAxiosError(403));
      await expect(board.deleteBoard(boardId)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxios.delete.mockRejectedValueOnce(makeAxiosError(404));
      await expect(board.deleteBoard(boardId)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxios.delete.mockRejectedValueOnce(makeAxiosError(500));
      await expect(board.deleteBoard(boardId)).rejects.toBeInstanceOf(InternalServerError);
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxios.delete.mockRejectedValueOnce(new Error('Unknown'));
      await expect(board.deleteBoard(boardId)).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('getBoardByFilterId', () => {
    it('should resolve on success', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: boardData });
      await expect(board.getBoardByFilterId(123)).resolves.toEqual(boardData);
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
      await expect(board.getBoardByFilterId(123)).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
      await expect(board.getBoardByFilterId(123)).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
      await expect(board.getBoardByFilterId(123)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
      await expect(board.getBoardByFilterId(123)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
      await expect(board.getBoardByFilterId(123)).rejects.toBeInstanceOf(InternalServerError);
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
      await expect(board.getBoardByFilterId(123)).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('getBoardBacklog', () => {
    const backlogResponse = {
      issues: [
        { id: '10001', key: 'HSP-1' },
        { id: '10002', key: 'HSP-2' },
      ],
      startAt: 0,
      maxResults: 50,
      total: 2,
    };

    it('should resolve on success', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: backlogResponse });
      await expect(board.getBoardBacklog(42)).resolves.toEqual(backlogResponse);
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
      await expect(board.getBoardBacklog(42)).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
      await expect(board.getBoardBacklog(42)).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
      await expect(board.getBoardBacklog(42)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
      await expect(board.getBoardBacklog(42)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
      await expect(board.getBoardBacklog(42)).rejects.toBeInstanceOf(InternalServerError);
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
      await expect(board.getBoardBacklog(42)).rejects.toBeInstanceOf(InternalServerError);
    });
  });
});

describe('getBoardConfiguration', () => {
  const configData = { id: 1, name: 'Test Config', type: 'scrum' };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: configData });
    await expect(board.getBoardConfiguration(boardId)).resolves.toEqual(configData);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardConfiguration(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardConfiguration(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardConfiguration(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardConfiguration(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardConfiguration(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardConfiguration(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('getBoardEpics', () => {
  const epicsResponse = {
    isLast: true,
    maxResults: 50,
    startAt: 0,
    total: 1,
    values: [
      {
        id: 1,
        key: 'EPIC-1',
        name: 'Test Epic',
        summary: 'Test Summary',
        color: { key: 'color_1' },
        done: false,
      },
    ],
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: epicsResponse });
    await expect(board.getBoardEpics(boardId)).resolves.toEqual(epicsResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardEpics(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardEpics(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardEpics(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardEpics(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardEpics(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardEpics(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('getBoardEpicNoneIssues', () => {
  const epicNoneIssuesResponse = {
    issues: [
      { id: '10001', key: 'ISSUE-1' },
      { id: '10002', key: 'ISSUE-2' },
    ],
    startAt: 0,
    maxResults: 50,
    total: 2,
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: epicNoneIssuesResponse });
    await expect(board.getBoardEpicNoneIssues(boardId)).resolves.toEqual(epicNoneIssuesResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardEpicNoneIssues(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardEpicNoneIssues(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardEpicNoneIssues(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardEpicNoneIssues(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardEpicNoneIssues(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardEpicNoneIssues(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('getBoardEpicIssues', () => {
  const epicIssuesResponse = {
    issues: [
      { id: '10003', key: 'ISSUE-3' },
      { id: '10004', key: 'ISSUE-4' },
    ],
    startAt: 0,
    maxResults: 50,
    total: 2,
  };
  const epicId = 123;

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: epicIssuesResponse });
    await expect(board.getBoardEpicIssues(boardId, epicId)).resolves.toEqual(epicIssuesResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardEpicIssues(boardId, epicId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardEpicIssues(boardId, epicId)).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardEpicIssues(boardId, epicId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardEpicIssues(boardId, epicId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardEpicIssues(boardId, epicId)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardEpicIssues(boardId, epicId)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });
});

describe('getBoardFeatures', () => {
  const featuresResponse = [
    { boardId: 1, feature: 'epics', enabled: true },
    { boardId: 1, feature: 'sprints', enabled: true },
  ];

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: featuresResponse });
    await expect(board.getBoardFeatures(boardId)).resolves.toEqual(featuresResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardFeatures(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardFeatures(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardFeatures(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardFeatures(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardFeatures(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardFeatures(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('updateBoardFeatures', () => {
  const updateInput = {
    features: [
      { boardId: 1, feature: 'epics', enabled: true },
      { boardId: 1, feature: 'sprints', enabled: false },
    ],
  };
  const updatedFeatures = [
    { boardId: 1, feature: 'epics', enabled: true },
    { boardId: 1, feature: 'sprints', enabled: false },
  ];

  it('should resolve on success', async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: updatedFeatures });
    await expect(board.updateBoardFeatures(boardId, updateInput)).resolves.toEqual(updatedFeatures);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.put.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.updateBoardFeatures(boardId, updateInput)).rejects.toBeInstanceOf(
      UserInputError
    );
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.put.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.updateBoardFeatures(boardId, updateInput)).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.put.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.updateBoardFeatures(boardId, updateInput)).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.put.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.updateBoardFeatures(boardId, updateInput)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.put.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.updateBoardFeatures(boardId, updateInput)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.updateBoardFeatures(boardId, updateInput)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });
});

describe('getBoardIssues', () => {
  const issuesResponse = {
    issues: [
      { id: '10001', key: 'ISSUE-1' },
      { id: '10002', key: 'ISSUE-2' },
    ],
    startAt: 0,
    maxResults: 50,
    total: 2,
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: issuesResponse });
    await expect(board.getBoardIssues(boardId)).resolves.toEqual(issuesResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardIssues(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardIssues(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardIssues(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardIssues(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardIssues(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardIssues(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('moveIssuesToBoard', () => {
  const moveInput = {
    issues: ['ISSUE-1', 'ISSUE-2'],
    rankAfterIssue: 'ISSUE-3',
  };

  it('should resolve on success', async () => {
    mockedAxios.post.mockResolvedValueOnce({});
    await expect(board.moveIssuesToBoard(boardId, moveInput)).resolves.toBeUndefined();
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.post.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.moveIssuesToBoard(boardId, moveInput)).rejects.toBeInstanceOf(
      UserInputError
    );
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.post.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.moveIssuesToBoard(boardId, moveInput)).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.post.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.moveIssuesToBoard(boardId, moveInput)).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.post.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.moveIssuesToBoard(boardId, moveInput)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.post.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.moveIssuesToBoard(boardId, moveInput)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.moveIssuesToBoard(boardId, moveInput)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });
});

describe('getBoardProjects', () => {
  const projectsResponse = {
    isLast: true,
    maxResults: 50,
    startAt: 0,
    total: 1,
    values: [
      {
        id: '10001',
        key: 'PROJ',
        name: 'Test Project',
        projectTypeKey: 'software',
        simplified: false,
      },
    ],
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: projectsResponse });
    await expect(board.getBoardProjects(boardId)).resolves.toEqual(projectsResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardProjects(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardProjects(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardProjects(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardProjects(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardProjects(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardProjects(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('getBoardProjectsFull', () => {
  const projectsFullResponse = {
    isLast: true,
    maxResults: 50,
    startAt: 0,
    total: 1,
    values: [
      {
        id: '10001',
        key: 'PROJ',
        name: 'Test Project',
        projectTypeKey: 'software',
        simplified: false,
      },
    ],
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: projectsFullResponse });
    await expect(board.getBoardProjectsFull(boardId)).resolves.toEqual(projectsFullResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardProjectsFull(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardProjectsFull(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardProjectsFull(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardProjectsFull(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardProjectsFull(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardProjectsFull(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('getBoardProperties', () => {
  const propertiesResponse = {
    keys: [
      { key: 'property1', value: 'value1' },
      { key: 'property2', value: 'value2' },
    ],
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: propertiesResponse });
    await expect(board.getBoardProperties(boardId)).resolves.toEqual(propertiesResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardProperties(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardProperties(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardProperties(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardProperties(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardProperties(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardProperties(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('getBoardProperty', () => {
  const propertyKey = 'test-property';
  const propertyValue = { test: 'value' };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: propertyValue });
    await expect(board.getBoardProperty(boardId, propertyKey)).resolves.toEqual(propertyValue);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      UserInputError
    );
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });
});

describe('setBoardProperty', () => {
  const propertyKey = 'test-property';
  const propertyValue = { test: 'value' };

  it('should resolve on success', async () => {
    mockedAxios.put.mockResolvedValueOnce({});
    await expect(
      board.setBoardProperty(boardId, propertyKey, propertyValue)
    ).resolves.toBeUndefined();
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.put.mockRejectedValueOnce(makeAxiosError(400));
    await expect(
      board.setBoardProperty(boardId, propertyKey, propertyValue)
    ).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.put.mockRejectedValueOnce(makeAxiosError(401));
    await expect(
      board.setBoardProperty(boardId, propertyKey, propertyValue)
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.put.mockRejectedValueOnce(makeAxiosError(403));
    await expect(
      board.setBoardProperty(boardId, propertyKey, propertyValue)
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.put.mockRejectedValueOnce(makeAxiosError(404));
    await expect(
      board.setBoardProperty(boardId, propertyKey, propertyValue)
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.put.mockRejectedValueOnce(makeAxiosError(500));
    await expect(
      board.setBoardProperty(boardId, propertyKey, propertyValue)
    ).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('Unknown'));
    await expect(
      board.setBoardProperty(boardId, propertyKey, propertyValue)
    ).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('deleteBoardProperty', () => {
  const propertyKey = 'test-property';

  it('should resolve on success', async () => {
    mockedAxios.delete.mockResolvedValueOnce({});
    await expect(board.deleteBoardProperty(boardId, propertyKey)).resolves.toBeUndefined();
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.delete.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.deleteBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      UserInputError
    );
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.delete.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.deleteBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.delete.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.deleteBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.delete.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.deleteBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.delete.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.deleteBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.delete.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.deleteBoardProperty(boardId, propertyKey)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });
});

describe('getBoardQuickFilters', () => {
  const quickFiltersResponse = {
    isLast: true,
    maxResults: 50,
    startAt: 0,
    total: 1,
    values: [
      {
        id: 1,
        boardId: 1,
        name: 'Test Filter',
        jql: 'project = TEST',
        description: 'Test description',
      },
    ],
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: quickFiltersResponse });
    await expect(board.getBoardQuickFilters(boardId)).resolves.toEqual(quickFiltersResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardQuickFilters(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardQuickFilters(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardQuickFilters(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardQuickFilters(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardQuickFilters(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardQuickFilters(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('getBoardQuickFilter', () => {
  const quickFilterId = 123;
  const quickFilterResponse = {
    id: quickFilterId,
    boardId: 1,
    name: 'Test Filter',
    jql: 'project = TEST',
    description: 'Test description',
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: quickFilterResponse });
    await expect(board.getBoardQuickFilter(boardId, quickFilterId)).resolves.toEqual(
      quickFilterResponse
    );
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardQuickFilter(boardId, quickFilterId)).rejects.toBeInstanceOf(
      UserInputError
    );
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardQuickFilter(boardId, quickFilterId)).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardQuickFilter(boardId, quickFilterId)).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardQuickFilter(boardId, quickFilterId)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardQuickFilter(boardId, quickFilterId)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardQuickFilter(boardId, quickFilterId)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });
});

describe('getBoardReports', () => {
  const reportsResponse = {
    reports: [
      { id: 'report1', name: 'Test Report', description: 'Test description' },
      { id: 'report2', name: 'Another Report' },
    ],
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: reportsResponse });
    await expect(board.getBoardReports(boardId)).resolves.toEqual(reportsResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardReports(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardReports(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardReports(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardReports(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardReports(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardReports(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('getBoardSprints', () => {
  const sprintsResponse = {
    isLast: true,
    maxResults: 50,
    startAt: 0,
    total: 1,
    values: [
      {
        id: 1,
        name: 'Sprint 1',
        state: 'active',
        startDate: '2023-01-01',
        endDate: '2023-01-15',
        goal: 'Test goal',
      },
    ],
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sprintsResponse });
    await expect(board.getBoardSprints(boardId)).resolves.toEqual(sprintsResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardSprints(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardSprints(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardSprints(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardSprints(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardSprints(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardSprints(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});

describe('getBoardSprintIssues', () => {
  const sprintId = 123;
  const sprintIssuesResponse = {
    issues: [
      { id: '10001', key: 'ISSUE-1' },
      { id: '10002', key: 'ISSUE-2' },
    ],
    startAt: 0,
    maxResults: 50,
    total: 2,
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sprintIssuesResponse });
    await expect(board.getBoardSprintIssues(boardId, sprintId)).resolves.toEqual(
      sprintIssuesResponse
    );
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardSprintIssues(boardId, sprintId)).rejects.toBeInstanceOf(
      UserInputError
    );
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardSprintIssues(boardId, sprintId)).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardSprintIssues(boardId, sprintId)).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardSprintIssues(boardId, sprintId)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardSprintIssues(boardId, sprintId)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardSprintIssues(boardId, sprintId)).rejects.toBeInstanceOf(
      InternalServerError
    );
  });
});

describe('getBoardVersions', () => {
  const versionsResponse = {
    isLast: true,
    maxResults: 50,
    startAt: 0,
    total: 1,
    values: [
      {
        id: '10001',
        name: 'Version 1.0',
        description: 'First release',
        archived: false,
        released: true,
        releaseDate: '2023-01-01',
      },
    ],
  };

  it('should resolve on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: versionsResponse });
    await expect(board.getBoardVersions(boardId)).resolves.toEqual(versionsResponse);
  });

  it('should throw UserInputError on 400', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(400));
    await expect(board.getBoardVersions(boardId)).rejects.toBeInstanceOf(UserInputError);
  });

  it('should throw AuthenticationError on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(board.getBoardVersions(boardId)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should throw ForbiddenError on 403', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(403));
    await expect(board.getBoardVersions(boardId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(404));
    await expect(board.getBoardVersions(boardId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw InternalServerError on 500', async () => {
    mockedAxios.get.mockRejectedValueOnce(makeAxiosError(500));
    await expect(board.getBoardVersions(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError on unknown error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unknown'));
    await expect(board.getBoardVersions(boardId)).rejects.toBeInstanceOf(InternalServerError);
  });
});
