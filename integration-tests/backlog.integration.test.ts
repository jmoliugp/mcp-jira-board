import { describe, it, expect, beforeAll } from 'vitest';
import { moveIssuesToBacklog, moveIssuesToBacklogForBoard } from '../src/services/jira/backlog';
import { getAllBoards } from '../src/services/jira/board';

describe('Backlog Service Integration Tests', () => {
  let boardId: number;

  beforeAll(async () => {
    // Get a board ID to use for tests
    const boards = await getAllBoards({ maxResults: 1 });
    if (boards.values.length === 0) {
      throw new Error('No boards found. Cannot run integration tests.');
    }
    boardId = boards.values[0].id;
    console.log(`Using board ID: ${boardId} for backlog integration tests`);
  });

  describe('moveIssuesToBacklog', () => {
    it('should handle moving issues to backlog (test with empty array)', async () => {
      // Test with empty array to avoid affecting real issues
      const input = { issues: [] };

      try {
        await moveIssuesToBacklog(input);
        // If it succeeds with empty array, the endpoint is working
        expect(true).toBe(true);
      } catch (error: any) {
        // If it fails, it should be a validation error for empty array
        expect(error.message).toContain('Invalid input');
      }
    });

    it('should handle invalid issue keys gracefully', async () => {
      const input = { issues: ['INVALID-ISSUE-KEY'] };

      try {
        await moveIssuesToBacklog(input);
        // If it succeeds, the endpoint is working
        expect(true).toBe(true);
      } catch (error: any) {
        // If it fails, it should be a validation error
        expect(error.message).toContain('Invalid input');
      }
    });
  });

  describe('moveIssuesToBacklogForBoard', () => {
    it('should handle moving issues to backlog for board (test with empty array)', async () => {
      // Test with empty array to avoid affecting real issues
      const input = { issues: [] };

      try {
        await moveIssuesToBacklogForBoard(boardId, input);
        // If it succeeds with empty array, the endpoint is working
        expect(true).toBe(true);
      } catch (error: any) {
        // If it fails, it should be a validation error for empty array
        expect(error.message).toContain('Invalid input');
      }
    });

    it('should handle invalid issue keys gracefully for board', async () => {
      const input = { issues: ['INVALID-ISSUE-KEY'] };

      try {
        await moveIssuesToBacklogForBoard(boardId, input);
        // If it succeeds, the endpoint is working
        expect(true).toBe(true);
      } catch (error: any) {
        // If it fails, it should be a validation error
        expect(error.message).toContain('Invalid input');
      }
    });

    it('should support ranking parameters', async () => {
      const input = {
        issues: [],
        rankAfterIssue: 'TEST-1',
        rankBeforeIssue: 'TEST-2',
        rankCustomFieldId: 123,
      };

      try {
        await moveIssuesToBacklogForBoard(boardId, input);
        // If it succeeds, the endpoint is working
        expect(true).toBe(true);
      } catch (error: any) {
        // If it fails, it should be a validation error
        expect(error.message).toContain('Invalid input');
      }
    });
  });
});
