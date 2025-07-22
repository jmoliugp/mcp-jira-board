import { describe, it, expect, vi, afterEach } from 'vitest';
import * as board from './board';
import { axiosClient } from './networking';
import {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from '../../utils/error';

vi.mock('./networking', async () => {
  const actual = await vi.importActual<typeof import('./networking')>('./networking');
  return {
    ...actual,
    axiosClient: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const mockedAxios = axiosClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
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
