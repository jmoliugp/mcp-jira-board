import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Logger } from '../utils/log.js';

import z from 'zod';

// Import Jira services
import * as boardService from '../services/jira/board.js';
import * as backlogService from '../services/jira/backlog.js';

const log = new Logger('MCP Server');

// Create an MCP server
const server = new McpServer({
  name: 'jira-mcp-server',
  version: '1.0.0',
});

// Board Management Tools

server.registerTool(
  'jira_get_all_boards',
  {
    title: 'Get All Boards',
    description: 'Retrieve all boards visible to the user with optional filtering',
    // @ts-ignore
    inputSchema: z.object({
      startAt: z.number().optional(),
      maxResults: z.number().optional(),
      type: z.enum(['scrum', 'kanban']).optional(),
      name: z.string().optional(),
      projectKeyOrId: z.string().optional(),
    }),
  },
  async params => {
    log.info(`🔧 Tool 'jira_get_all_boards' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await boardService.getAllBoards(params || {});
      log.info(`✅ Retrieved ${result.values.length} boards`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_all_boards: ${error}`);
      throw error;
    }
  }
);

server.registerTool(
  'jira_create_board',
  {
    title: 'Create Board',
    description: 'Create a new scrum or kanban board',
    // @ts-ignore
    inputSchema: z.object({
      name: z.string(),
      type: z.enum(['scrum', 'kanban']),
      filterId: z.number(),
      location: z
        .object({
          type: z.enum(['project', 'user']),
          projectKeyOrId: z.string().optional(),
        })
        .optional(),
    }),
  },
  async params => {
    log.info(`🔧 Tool 'jira_create_board' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await boardService.createBoard(params as boardService.CreateBoardInput);
      log.info(`✅ Created board: ${result.name} (ID: ${result.id})`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_create_board: ${error}`);
      throw error;
    }
  }
);

server.registerTool(
  'jira_get_board_by_id',
  {
    title: 'Get Board by ID',
    description: 'Retrieve board details by board ID',
    // @ts-ignore
    inputSchema: z.object({
      boardId: z.number(),
    }),
  },
  async ({ boardId }) => {
    log.info(`🔧 Tool 'jira_get_board_by_id' called with boardId: ${boardId}`);
    try {
      const result = await boardService.getBoardById(boardId);
      log.info(`✅ Retrieved board: ${result.name}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_board_by_id: ${error}`);
      throw error;
    }
  }
);

server.registerTool(
  'jira_delete_board',
  {
    title: 'Delete Board',
    description: 'Delete a board by ID',
    // @ts-ignore
    inputSchema: z.object({
      boardId: z.number(),
    }),
  },
  async ({ boardId }) => {
    log.info(`🔧 Tool 'jira_delete_board' called with boardId: ${boardId}`);
    try {
      await boardService.deleteBoard(boardId);
      log.info(`✅ Deleted board with ID: ${boardId}`);
      return {
        content: [{ type: 'text', text: `Board ${boardId} deleted successfully` }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_delete_board: ${error}`);
      throw error;
    }
  }
);

server.registerTool(
  'jira_get_board_backlog',
  {
    title: 'Get Board Backlog',
    description: 'Get issues in the backlog of a board',
    // @ts-ignore
    inputSchema: z.object({
      boardId: z.number(),
      startAt: z.number().optional(),
      maxResults: z.number().optional(),
    }),
  },
  async ({ boardId, startAt, maxResults }) => {
    log.info(`🔧 Tool 'jira_get_board_backlog' called with boardId: ${boardId}`);
    try {
      const result = await boardService.getBoardBacklog(boardId, { startAt, maxResults });
      log.info(`✅ Retrieved ${result.issues.length} backlog issues`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_board_backlog: ${error}`);
      throw error;
    }
  }
);

server.registerTool(
  'jira_get_board_epics',
  {
    title: 'Get Board Epics',
    description: 'Get epics for a board',
    // @ts-ignore
    inputSchema: z.object({
      boardId: z.number(),
      startAt: z.number().optional(),
      maxResults: z.number().optional(),
    }),
  },
  async ({ boardId, startAt, maxResults }) => {
    log.info(`🔧 Tool 'jira_get_board_epics' called with boardId: ${boardId}`);
    try {
      const result = await boardService.getBoardEpics(boardId, { startAt, maxResults });
      log.info(`✅ Retrieved ${result.values.length} epics`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_board_epics: ${error}`);
      throw error;
    }
  }
);

server.registerTool(
  'jira_get_board_sprints',
  {
    title: 'Get Board Sprints',
    description: 'Get sprints for a board',
    // @ts-ignore
    inputSchema: z.object({
      boardId: z.number(),
      startAt: z.number().optional(),
      maxResults: z.number().optional(),
      state: z.string().optional(),
    }),
  },
  async ({ boardId, startAt, maxResults, state }) => {
    log.info(`🔧 Tool 'jira_get_board_sprints' called with boardId: ${boardId}`);
    try {
      const result = await boardService.getBoardSprints(boardId, { startAt, maxResults, state });
      log.info(`✅ Retrieved ${result.values.length} sprints`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_board_sprints: ${error}`);
      throw error;
    }
  }
);

server.registerTool(
  'jira_get_board_issues',
  {
    title: 'Get Board Issues',
    description: 'Get issues for a board',
    // @ts-ignore
    inputSchema: z.object({
      boardId: z.number(),
      startAt: z.number().optional(),
      maxResults: z.number().optional(),
    }),
  },
  async ({ boardId, startAt, maxResults }) => {
    log.info(`🔧 Tool 'jira_get_board_issues' called with boardId: ${boardId}`);
    try {
      const result = await boardService.getBoardIssues(boardId, { startAt, maxResults });
      log.info(`✅ Retrieved ${result.issues.length} issues`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_board_issues: ${error}`);
      throw error;
    }
  }
);

server.registerTool(
  'jira_move_issues_to_board',
  {
    title: 'Move Issues to Board',
    description: 'Move issues to a board with optional ranking',
    // @ts-ignore
    inputSchema: z.object({
      boardId: z.number(),
      issues: z.array(z.string()),
      rankAfterIssue: z.string().optional(),
      rankBeforeIssue: z.string().optional(),
      rankCustomFieldId: z.number().optional(),
    }),
  },
  async ({ boardId, issues, rankAfterIssue, rankBeforeIssue, rankCustomFieldId }) => {
    log.info(
      `🔧 Tool 'jira_move_issues_to_board' called with boardId: ${boardId}, issues: ${issues.length}`
    );
    try {
      await boardService.moveIssuesToBoard(boardId, {
        issues,
        rankAfterIssue,
        rankBeforeIssue,
        rankCustomFieldId,
      });
      log.info(`✅ Moved ${issues.length} issues to board ${boardId}`);
      return {
        content: [
          { type: 'text', text: `Successfully moved ${issues.length} issues to board ${boardId}` },
        ],
      };
    } catch (error) {
      log.error(`❌ Error in jira_move_issues_to_board: ${error}`);
      throw error;
    }
  }
);

// Backlog Management Tools

server.registerTool(
  'jira_move_issues_to_backlog',
  {
    title: 'Move Issues to Backlog',
    description: 'Move issues to the backlog (remove from sprints)',
    // @ts-ignore
    inputSchema: z.object({
      issues: z.array(z.string()),
    }),
  },
  async ({ issues }) => {
    log.info(`🔧 Tool 'jira_move_issues_to_backlog' called with ${issues.length} issues`);
    try {
      await backlogService.moveIssuesToBacklog({ issues });
      log.info(`✅ Moved ${issues.length} issues to backlog`);
      return {
        content: [{ type: 'text', text: `Successfully moved ${issues.length} issues to backlog` }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_move_issues_to_backlog: ${error}`);
      throw error;
    }
  }
);

server.registerTool(
  'jira_move_issues_to_backlog_for_board',
  {
    title: 'Move Issues to Backlog for Board',
    description: 'Move issues to the backlog of a specific board',
    // @ts-ignore
    inputSchema: z.object({
      boardId: z.number(),
      issues: z.array(z.string()),
      rankAfterIssue: z.string().optional(),
      rankBeforeIssue: z.string().optional(),
      rankCustomFieldId: z.number().optional(),
    }),
  },
  async ({ boardId, issues, rankAfterIssue, rankBeforeIssue, rankCustomFieldId }) => {
    log.info(
      `🔧 Tool 'jira_move_issues_to_backlog_for_board' called with boardId: ${boardId}, issues: ${issues.length}`
    );
    try {
      await backlogService.moveIssuesToBacklogForBoard(boardId, {
        issues,
        rankAfterIssue,
        rankBeforeIssue,
        rankCustomFieldId,
      });
      log.info(`✅ Moved ${issues.length} issues to backlog for board ${boardId}`);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully moved ${issues.length} issues to backlog for board ${boardId}`,
          },
        ],
      };
    } catch (error) {
      log.error(`❌ Error in jira_move_issues_to_backlog_for_board: ${error}`);
      throw error;
    }
  }
);

// Board Resources

server.registerResource(
  'board',
  new ResourceTemplate('jira://board/{boardId}', { list: undefined }),
  {
    title: 'Jira Board Resource',
    description: 'Access board information and details',
  },
  async (uri, { boardId }) => {
    if (!boardId) {
      throw new Error('boardId is required');
    }
    if (Array.isArray(boardId)) {
      throw new Error('boardId must be a single value, not an array');
    }
    log.info(`📄 Resource 'board' requested for boardId: ${boardId}`);
    try {
      const boardIdNum = parseInt(boardId);
      const board = await boardService.getBoardById(boardIdNum);
      const backlog = await boardService.getBoardBacklog(boardIdNum, { maxResults: 10 });
      const epics = await boardService.getBoardEpics(boardIdNum, { maxResults: 10 });
      const sprints = await boardService.getBoardSprints(boardIdNum, { maxResults: 10 });

      const boardInfo = {
        board,
        backlog: { issues: backlog.issues, total: backlog.total },
        epics: { values: epics.values, total: epics.total },
        sprints: { values: sprints.values, total: sprints.total },
      };

      log.info(`✅ Generated board resource for board: ${board.name || 'Unknown'}`);
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(boardInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      log.error(`❌ Error generating board resource: ${error}`);
      throw error;
    }
  }
);

server.registerResource(
  'boards',
  new ResourceTemplate('jira://boards', { list: undefined }),
  {
    title: 'Jira Boards List Resource',
    description: 'Access list of all boards',
  },
  async uri => {
    log.info(`📄 Resource 'boards' requested`);
    try {
      const boards = await boardService.getAllBoards({ maxResults: 50 });
      log.info(`✅ Generated boards resource with ${boards.values.length} boards`);
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(boards, null, 2),
          },
        ],
      };
    } catch (error) {
      log.error(`❌ Error generating boards resource: ${error}`);
      throw error;
    }
  }
);

export const startServer = async () => {
  log.info('🔌 Starting Jira MCP server with stdio transport...');

  try {
    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log.success('✅ Jira MCP server connected successfully');
  } catch (error) {
    log.error(`❌ Failed to start Jira MCP server: ${error}`);
    throw error;
  }
};

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}
