import { describe, it, expect, vi, afterEach } from 'vitest';
import * as backlog from './backlog';
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
      post: vi.fn(),
    },
  };
});

const mockedAxios = axiosClient as unknown as { post: ReturnType<typeof vi.fn> };

const input = { issues: ['ISSUE-1'] };
const boardId = 123;
const boardInput = { issues: ['ISSUE-1'], rankAfterIssue: 'ISSUE-2' };

function makeAxiosError(status: number, data: any = {}) {
  const err: any = new Error('Axios error');
  err.response = { status, data };
  return err;
}

describe('backlog service', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('moveIssuesToBacklog', () => {
    it('should resolve on success', async () => {
      mockedAxios.post.mockResolvedValueOnce({});
      await expect(backlog.moveIssuesToBacklog(input)).resolves.toBeUndefined();
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(400));
      await expect(backlog.moveIssuesToBacklog(input)).rejects.toBeInstanceOf(UserInputError);
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(401));
      await expect(backlog.moveIssuesToBacklog(input)).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(403));
      await expect(backlog.moveIssuesToBacklog(input)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(404));
      await expect(backlog.moveIssuesToBacklog(input)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(500));
      await expect(backlog.moveIssuesToBacklog(input)).rejects.toBeInstanceOf(InternalServerError);
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Unknown'));
      await expect(backlog.moveIssuesToBacklog(input)).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('moveIssuesToBacklogForBoard', () => {
    it('should resolve on success', async () => {
      mockedAxios.post.mockResolvedValueOnce({});
      await expect(
        backlog.moveIssuesToBacklogForBoard(boardId, boardInput)
      ).resolves.toBeUndefined();
    });

    it('should throw UserInputError on 400', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(400));
      await expect(backlog.moveIssuesToBacklogForBoard(boardId, boardInput)).rejects.toBeInstanceOf(
        UserInputError
      );
    });

    it('should throw AuthenticationError on 401', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(401));
      await expect(backlog.moveIssuesToBacklogForBoard(boardId, boardInput)).rejects.toBeInstanceOf(
        AuthenticationError
      );
    });

    it('should throw ForbiddenError on 403', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(403));
      await expect(backlog.moveIssuesToBacklogForBoard(boardId, boardInput)).rejects.toBeInstanceOf(
        ForbiddenError
      );
    });

    it('should throw NotFoundError on 404', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(404));
      await expect(backlog.moveIssuesToBacklogForBoard(boardId, boardInput)).rejects.toBeInstanceOf(
        NotFoundError
      );
    });

    it('should throw InternalServerError on 500', async () => {
      mockedAxios.post.mockRejectedValueOnce(makeAxiosError(500));
      await expect(backlog.moveIssuesToBacklogForBoard(boardId, boardInput)).rejects.toBeInstanceOf(
        InternalServerError
      );
    });

    it('should throw InternalServerError on unknown error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Unknown'));
      await expect(backlog.moveIssuesToBacklogForBoard(boardId, boardInput)).rejects.toBeInstanceOf(
        InternalServerError
      );
    });
  });
});
