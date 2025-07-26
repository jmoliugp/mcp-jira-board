import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import crypto from 'node:crypto';
import http from 'node:http';
import z from 'zod';
import * as backlogService from '../services/jira/backlog.js';
import * as boardService from '../services/jira/board.js';
import * as filterService from '../services/jira/filter.js';
import * as projectService from '../services/jira/project.js';
import * as issueService from '../services/jira/issue.js';
import { Logger } from '../utils/log.js';

// Import Jira services

const log = new Logger('MCP SSE Server');

// Create an MCP server
const server = new McpServer({
  name: 'jira-mcp-server',
  version: '1.0.0',
});

log.info('🔧 Initializing Jira MCP server with tools and resources...');

// Board Management Tools

server.tool(
  'jira_get_all_boards',
  {
    startAt: z.number().optional(),
    maxResults: z.number().optional(),
    type: z.enum(['scrum', 'kanban']).optional(),
    name: z.string().optional(),
    projectKeyOrId: z.string().optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_get_all_boards' called with params: ${JSON.stringify(params)}`);
    log.info(`🔍 Params type: ${typeof params}, keys: ${params ? Object.keys(params) : 'null'}`);
    try {
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      );
      const result = await boardService.getAllBoards(filteredParams);

      log.info(`✅ Retrieved ${result.values.length} boards`);
      log.info(`📤 Returning result to Cursor...`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_all_boards: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_create_board',
  {
    name: z.string(),
    type: z.enum(['scrum', 'kanban']),
    location: z
      .object({
        type: z.enum(['project', 'user']),
        projectKeyOrId: z.string().optional(),
      })
      .optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_create_board' called with params: ${JSON.stringify(params)}`);
    try {
      // Get or create a default filter with maximum privileges
      const defaultFilterId = await filterService.getOrCreateDefaultFilter();

      const input: boardService.CreateBoardInput = {
        name: params['name'],
        type: params['type'],
        filterId: defaultFilterId,
        ...(params['location'] && {
          location: {
            type: params['location'].type,
            projectKeyOrId: params['location'].projectKeyOrId || '',
          },
        }),
      };

      log.info(`📤 Sending to boardService.createBoard: ${JSON.stringify(input)}`);

      const result = await boardService.createBoard(input);
      log.info(`✅ Created board: ${result.name} (ID: ${result.id})`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_create_board: ${error}`);
      // Log more details about the error
      if (error instanceof Error) {
        log.error(`❌ Error message: ${error.message}`);
        log.error(`❌ Error stack: ${error.stack}`);
      }
      throw error;
    }
  }
);

// Project Management Tools

server.tool(
  'jira_create_project',
  {
    key: z
      .string()
      .describe(
        'Project key (must start with uppercase letter, only alphanumeric characters, no spaces or special characters)'
      ),
    name: z.string().describe('Project name'),
    projectTypeKey: z
      .enum(['software', 'service_desk', 'business'])
      .describe('Type of project: software, service_desk, or business'),
    description: z.string().optional().describe('Optional project description'),
    url: z.string().optional().describe('Optional project URL'),
    assigneeType: z
      .enum(['PROJECT_LEAD', 'UNASSIGNED'])
      .optional()
      .describe('How issues are assigned: PROJECT_LEAD or UNASSIGNED'),
    boardName: z
      .string()
      .optional()
      .describe('Optional custom board name (defaults to "{ProjectName} Board")'),
    boardType: z
      .enum(['scrum', 'kanban'])
      .optional()
      .describe('Optional board type: scrum or kanban (defaults to scrum)'),
  },
  {
    description:
      'Create a new Jira project with an optional board. If no board parameters are provided, a default board will be created automatically. The project will have admin privileges.',
    examples: [
      {
        name: 'Create Project with Default Board',
        input: {
          key: 'TEST',
          name: 'Test Project',
          projectTypeKey: 'software',
          description: 'A test project',
        },
      },
      {
        name: 'Create Project with Custom Board',
        input: {
          key: 'WEBAPP',
          name: 'Web Application',
          projectTypeKey: 'software',
          description: 'Modern web application',
          boardName: 'Development Board',
          boardType: 'scrum',
        },
      },
    ],
  },
  async params => {
    log.info(`🔧 Tool 'jira_create_project' called with params: ${JSON.stringify(params)}`);
    try {
      // Validate project key format
      const projectKey = params['key'];
      if (!/^[A-Z][A-Z0-9]*$/.test(projectKey)) {
        throw new Error(
          `Invalid project key "${projectKey}". Project keys must start with an uppercase letter and contain only uppercase alphanumeric characters (A-Z, 0-9). Examples: WEBAPP, TEST123, MYPROJECT`
        );
      }

      log.info(`🔧 Creating project with automatic admin privileges...`);

      const input: projectService.CreateProjectInput = {
        key: projectKey,
        name: params['name'],
        projectTypeKey: params['projectTypeKey'],
        ...(params['description'] && { description: params['description'] }),
        ...(params['url'] && { url: params['url'] }),
        // Note: assigneeType and leadAccountId will be automatically set by the service
        // to ensure admin privileges for the current user
      };

      // Determine board name and type
      const boardName = params['boardName'] || `${params['name']} Board`;
      const boardType = params['boardType'] || 'scrum';

      log.info(`🔧 Creating project with board: ${boardName} (${boardType})`);

      log.info(`📤 Sending to projectService.createProjectWithBoard: ${JSON.stringify(input)}`);

      const result = await projectService.createProjectWithBoard(input, boardName, boardType);
      log.info(
        `✅ Created project with admin privileges: ${result.project.name} (Key: ${result.project.key})`
      );

      if (result.board) {
        log.info(`🎉 Board "${result.board.name}" (ID: ${result.board.id}) created successfully!`);
      } else {
        log.warn(`⚠️ Project created but board creation failed`);
      }

      log.info(`🎉 You now have FULL ADMIN PERMISSIONS for all operations in this project!`);

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_create_project: ${error}`);
      if (error instanceof Error) {
        log.error(`❌ Error message: ${error.message}`);
        log.error(`❌ Error stack: ${error.stack}`);

        // Add more detailed error information
        if ('context' in error && error.context) {
          log.error(`❌ Error context: ${JSON.stringify(error.context, null, 2)}`);
        }
      }
      throw error;
    }
  }
);

server.tool(
  'jira_get_all_projects',
  {
    startAt: z.number().optional(),
    maxResults: z.number().optional(),
    orderBy: z.enum(['key', 'name', 'category', '-key', '-name', '-category']).optional(),
    query: z.string().optional(),
    typeKey: z.string().optional(),
    status: z.enum(['live', 'archived', 'deleted']).optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_get_all_projects' called with params: ${JSON.stringify(params)}`);
    try {
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      );

      const result = await projectService.getAllProjects(filteredParams);
      log.info(`✅ Retrieved ${result.values.length} projects`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_all_projects: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_get_project',
  {
    projectIdOrKey: z.string(),
    expand: z.string().optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_get_project' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await projectService.getProject(params['projectIdOrKey'], params['expand']);
      log.info(`✅ Retrieved project: ${result.name} (Key: ${result.key})`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_project: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_check_project_exists',
  {
    projectKey: z.string(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_check_project_exists' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await projectService.getProject(params['projectKey']);
      log.info(`✅ Project exists: ${result.name} (Key: ${result.key})`);
      return {
        content: [
          { type: 'text', text: JSON.stringify({ exists: true, project: result }, null, 2) },
        ],
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        log.info(`✅ Project does not exist: ${params['projectKey']}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ exists: false, projectKey: params['projectKey'] }, null, 2),
            },
          ],
        };
      }
      log.error(`❌ Error in jira_check_project_exists: ${error}`);
      throw error;
    }
  }
);

server.tool('jira_get_current_user', {}, async () => {
  log.info(`🔧 Tool 'jira_get_current_user' called`);
  try {
    const result = await projectService.getCurrentUser();
    log.info(`✅ Retrieved current user: ${result.displayName} (${result.emailAddress})`);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    log.error(`❌ Error in jira_get_current_user: ${error}`);
    throw error;
  }
});

server.tool(
  'jira_update_project',
  {
    projectIdOrKey: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    assigneeType: z.enum(['PROJECT_LEAD', 'UNASSIGNED']).optional(),
    leadAccountId: z.string().optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_update_project' called with params: ${JSON.stringify(params)}`);
    try {
      const { projectIdOrKey, ...updateData } = params;
      // Filter out undefined values to satisfy TypeScript strict mode
      const input: projectService.UpdateProjectInput = Object.fromEntries(
        Object.entries(updateData).filter(([, value]) => value !== undefined)
      );

      const result = await projectService.updateProject(projectIdOrKey, input);
      log.info(`✅ Updated project: ${result.name} (Key: ${result.key})`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_update_project: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_delete_project',
  {
    projectIdOrKey: z.string(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_delete_project' called with params: ${JSON.stringify(params)}`);
    try {
      await projectService.deleteProject(params['projectIdOrKey']);
      log.info(`✅ Deleted project: ${params['projectIdOrKey']}`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: 'Project deleted successfully' }, null, 2),
          },
        ],
      };
    } catch (error) {
      log.error(`❌ Error in jira_delete_project: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_create_project_with_board',
  {
    key: z
      .string()
      .describe(
        'Project key (must start with uppercase letter, only alphanumeric characters, no spaces or special characters)'
      ),
    name: z.string().describe('Project name'),
    projectTypeKey: z
      .enum(['software', 'service_desk', 'business'])
      .describe('Type of project: software, service_desk, or business'),
    description: z.string().optional().describe('Optional project description'),
    url: z.string().optional().describe('Optional project URL'),
    assigneeType: z
      .enum(['PROJECT_LEAD', 'UNASSIGNED'])
      .optional()
      .describe('How issues are assigned: PROJECT_LEAD or UNASSIGNED'),
    boardName: z.string().describe('Name for the board that will be created with the project'),
    boardType: z
      .enum(['scrum', 'kanban'])
      .describe('Type of board: scrum (for sprints) or kanban (for continuous flow)'),
  },
  {
    description:
      'Create a new Jira project with an associated board. The project will have admin privileges and the board will be linked to the project. This is useful for setting up a complete project structure in one operation.',
    examples: [
      {
        name: 'Create Software Project with Scrum Board',
        input: {
          key: 'WEBAPP',
          name: 'Web Application',
          projectTypeKey: 'software',
          description: 'Modern web application development',
          boardName: 'Development Board',
          boardType: 'scrum',
        },
      },
      {
        name: 'Create Service Desk with Kanban Board',
        input: {
          key: 'SUPPORT',
          name: 'Customer Support',
          projectTypeKey: 'service_desk',
          description: 'Customer support and ticket management',
          boardName: 'Ticket Management',
          boardType: 'kanban',
        },
      },
    ],
  },
  async params => {
    log.info(
      `🔧 Tool 'jira_create_project_with_board' called with params: ${JSON.stringify(params)}`
    );
    try {
      // Validate project key format
      const projectKey = params['key'];
      if (!/^[A-Z][A-Z0-9]*$/.test(projectKey)) {
        throw new Error(
          `Invalid project key "${projectKey}". Project keys must start with an uppercase letter and contain only uppercase alphanumeric characters (A-Z, 0-9). Examples: WEBAPP, TEST123, MYPROJECT`
        );
      }

      log.info(`🔧 Creating project with board and automatic admin privileges...`);

      const projectInput: projectService.CreateProjectInput = {
        key: projectKey,
        name: params['name'],
        projectTypeKey: params['projectTypeKey'],
        ...(params['description'] && { description: params['description'] }),
        ...(params['url'] && { url: params['url'] }),
        // Note: assigneeType and leadAccountId will be automatically set by the service
        // to ensure admin privileges for the current user
      };

      const result = await projectService.createProjectWithBoard(
        projectInput,
        params['boardName'],
        params['boardType']
      );

      log.info(
        `✅ Created project with admin privileges: ${result.project.name} (Key: ${result.project.key})`
      );

      if (result.board) {
        log.info(`🎉 Board "${result.board.name}" (ID: ${result.board.id}) created successfully!`);
      } else {
        log.warn(`⚠️ Project created but board creation failed`);
      }

      log.info(`🎉 You now have FULL ADMIN PERMISSIONS for all operations in this project!`);

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_create_project_with_board: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_get_board_by_id',
  {
    boardId: z.number(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_get_board_by_id' called with params: ${JSON.stringify(params)}`);
    try {
      if (!params || !params['boardId']) {
        log.error(`❌ jira_get_board_by_id called without boardId parameter`);
        throw new Error('boardId parameter is required');
      }
      const result = await boardService.getBoardById(params['boardId']);
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

server.tool(
  'jira_delete_board',
  {
    boardId: z.number(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_delete_board' called with params: ${JSON.stringify(params)}`);
    try {
      await boardService.deleteBoard(params['boardId']);
      log.info(`✅ Deleted board with ID: ${params['boardId']}`);
      return {
        content: [{ type: 'text', text: `Board ${params['boardId']} deleted successfully` }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_delete_board: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_get_board_backlog',
  {
    boardId: z.number(),
    startAt: z.number().optional(),
    maxResults: z.number().optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_get_board_backlog' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await boardService.getBoardBacklog(params['boardId'], {
        ...(params['startAt'] !== undefined && { startAt: params['startAt'] }),
        ...(params['maxResults'] !== undefined && { maxResults: params['maxResults'] }),
      });
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

server.tool(
  'jira_get_board_epics',
  {
    boardId: z.number(),
    startAt: z.number().optional(),
    maxResults: z.number().optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_get_board_epics' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await boardService.getBoardEpics(params['boardId'], {
        ...(params['startAt'] !== undefined && { startAt: params['startAt'] }),
        ...(params['maxResults'] !== undefined && { maxResults: params['maxResults'] }),
      });
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

server.tool(
  'jira_get_board_sprints',
  {
    boardId: z.number(),
    startAt: z.number().optional(),
    maxResults: z.number().optional(),
    state: z.string().optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_get_board_sprints' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await boardService.getBoardSprints(params['boardId'], {
        ...(params['startAt'] !== undefined && { startAt: params['startAt'] }),
        ...(params['maxResults'] !== undefined && { maxResults: params['maxResults'] }),
        ...(params['state'] !== undefined && { state: params['state'] }),
      });
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

server.tool(
  'jira_get_board_issues',
  {
    boardId: z.number(),
    startAt: z.number().optional(),
    maxResults: z.number().optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_get_board_issues' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await boardService.getBoardIssues(params['boardId'], {
        ...(params['startAt'] !== undefined && { startAt: params['startAt'] }),
        ...(params['maxResults'] !== undefined && { maxResults: params['maxResults'] }),
      });
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

server.tool(
  'jira_move_issues_to_board',
  {
    boardId: z.number(),
    issues: z.array(z.string()),
    rankAfterIssue: z.string().optional(),
    rankBeforeIssue: z.string().optional(),
    rankCustomFieldId: z.number().optional(),
  },
  async params => {
    log.info(
      `🔧 Tool 'jira_move_issues_to_board' called with boardId: ${params['boardId']}, issues: ${params['issues'].length}`
    );
    try {
      await boardService.moveIssuesToBoard(params['boardId'], {
        issues: params['issues'],
        ...(params['rankAfterIssue'] !== undefined && { rankAfterIssue: params['rankAfterIssue'] }),
        ...(params['rankBeforeIssue'] !== undefined && {
          rankBeforeIssue: params['rankBeforeIssue'],
        }),
        ...(params['rankCustomFieldId'] !== undefined && {
          rankCustomFieldId: params['rankCustomFieldId'],
        }),
      });
      log.info(`✅ Moved ${params['issues'].length} issues to board ${params['boardId']}`);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully moved ${params['issues'].length} issues to board ${params['boardId']}`,
          },
        ],
      };
    } catch (error) {
      log.error(`❌ Error in jira_move_issues_to_board: ${error}`);
      throw error;
    }
  }
);

// Filter Management Tools

server.tool('jira_get_my_filters', {}, async () => {
  log.info(`🔧 Tool 'jira_get_my_filters' called`);
  try {
    const result = await filterService.getMyFilters();
    log.info(`✅ Retrieved ${result.values.length} filters`);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    log.error(`❌ Error in jira_get_my_filters: ${error}`);
    throw error;
  }
});

server.tool('jira_get_favourite_filters', {}, async () => {
  log.info(`🔧 Tool 'jira_get_favourite_filters' called`);
  try {
    const result = await filterService.getFavouriteFilters();
    log.info(`✅ Retrieved ${result.values.length} favourite filters`);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    log.error(`❌ Error in jira_get_favourite_filters: ${error}`);
    throw error;
  }
});

server.tool(
  'jira_search_filters',
  {
    filterName: z.string().optional(),
    accountId: z.string().optional(),
    owner: z.string().optional(),
    groupname: z.string().optional(),
    projectId: z.number().optional(),
    id: z.number().optional(),
    orderBy: z.string().optional(),
    startAt: z.number().optional(),
    maxResults: z.number().optional(),
    expand: z.string().optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_search_filters' called with params: ${JSON.stringify(params)}`);
    try {
      // Filter out undefined values to satisfy TypeScript strict mode
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      );
      const result = await filterService.searchFilters(filteredParams);
      log.info(`✅ Retrieved ${result.values.length} filters from search`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_search_filters: ${error}`);
      throw error;
    }
  }
);

// Backlog Management Tools

server.tool(
  'jira_move_issues_to_backlog',
  {
    issues: z.array(z.string()),
  },
  async params => {
    log.info(`🔧 Tool 'jira_move_issues_to_backlog' called with ${params['issues'].length} issues`);
    try {
      await backlogService.moveIssuesToBacklog({ issues: params['issues'] });
      log.info(`✅ Moved ${params['issues'].length} issues to backlog`);
      return {
        content: [
          { type: 'text', text: `Successfully moved ${params['issues'].length} issues to backlog` },
        ],
      };
    } catch (error) {
      log.error(`❌ Error in jira_move_issues_to_backlog: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_move_issues_to_backlog_for_board',
  {
    boardId: z.number(),
    issues: z.array(z.string()),
    rankAfterIssue: z.string().optional(),
    rankBeforeIssue: z.string().optional(),
    rankCustomFieldId: z.number().optional(),
  },
  async params => {
    log.info(
      `🔧 Tool 'jira_move_issues_to_backlog_for_board' called with boardId: ${params['boardId']}, issues: ${params['issues'].length}`
    );
    try {
      await backlogService.moveIssuesToBacklogForBoard(params['boardId'], {
        issues: params['issues'],
        ...(params['rankAfterIssue'] !== undefined && { rankAfterIssue: params['rankAfterIssue'] }),
        ...(params['rankBeforeIssue'] !== undefined && {
          rankBeforeIssue: params['rankBeforeIssue'],
        }),
        ...(params['rankCustomFieldId'] !== undefined && {
          rankCustomFieldId: params['rankCustomFieldId'],
        }),
      });
      log.info(
        `✅ Moved ${params['issues'].length} issues to backlog for board ${params['boardId']}`
      );
      return {
        content: [
          {
            type: 'text',
            text: `Successfully moved ${params['issues'].length} issues to backlog for board ${params['boardId']}`,
          },
        ],
      };
    } catch (error) {
      log.error(`❌ Error in jira_move_issues_to_backlog_for_board: ${error}`);
      throw error;
    }
  }
);

// Issue Management Tools

server.tool('jira_get_issue_types', {}, async () => {
  log.info(`🔧 Tool 'jira_get_issue_types' called`);
  try {
    const result = await issueService.getIssueTypes();
    log.info(`✅ Retrieved ${result.values.length} issue types`);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    log.error(`❌ Error in jira_get_issue_types: ${error}`);
    throw error;
  }
});

server.tool(
  'jira_get_project_issue_types',
  {
    projectKey: z.string(),
  },
  {
    description:
      'Get available issue types for a specific project. This is more useful than jira_get_issue_types as it shows only the issue types that can be used in the specified project.',
    examples: [
      {
        name: 'Get FITPULSE Project Issue Types',
        input: {
          projectKey: 'FITPULSE',
        },
      },
    ],
  },
  async params => {
    log.info(
      `🔧 Tool 'jira_get_project_issue_types' called with params: ${JSON.stringify(params)}`
    );
    try {
      const result = await projectService.getProject(params['projectKey']);
      const issueTypes = result.issueTypes || [];

      log.info(
        `✅ Retrieved ${issueTypes.length} issue types for project '${params['projectKey']}'`
      );

      // Format the response to be more user-friendly
      const formattedResult = {
        projectKey: params['projectKey'],
        projectName: result.name,
        issueTypes: issueTypes.map(it => ({
          id: it.id,
          name: it.name,
          description: it.description,
          subtask: it.subtask,
        })),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(formattedResult, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_project_issue_types: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_create_user_story',
  {
    projectKey: z.string(),
    summary: z.string(),
    description: z.string().optional(),
    assigneeAccountId: z.string().optional(),
    storyPoints: z.number().optional(),
    labels: z.array(z.string()).optional(),
  },
  {
    description:
      'Create a user story in a Jira project. The function will automatically find the best available issue type (Story, Task, etc.) for the project. Note: Labels may not be supported by all projects.',
    examples: [
      {
        name: 'Create User Story for FITPULSE',
        input: {
          projectKey: 'FITPULSE',
          summary: 'Setup project structure and development environment',
          description: 'As a developer, I need to set up the initial project structure...',
          labels: ['landing-page', 'frontend'],
        },
      },
    ],
  },
  async params => {
    log.info(`🔧 Tool 'jira_create_user_story' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await issueService.createUserStory(
        params['projectKey'],
        params['summary'],
        params['description'],
        params['assigneeAccountId'],
        params['storyPoints'],
        params['labels']
      );
      log.info(`✅ Created user story: ${result.key}`);

      // Add helpful information about the created issue
      const response = {
        ...result,
        note:
          params['labels'] && params['labels'].length > 0
            ? `Note: Labels were provided but may not be displayed if the project doesn't support them.`
            : undefined,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_create_user_story: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_create_bug',
  {
    projectKey: z.string(),
    summary: z.string(),
    description: z.string().optional(),
    assigneeAccountId: z.string().optional(),
    priority: z.string().optional(),
    labels: z.array(z.string()).optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_create_bug' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await issueService.createBug(
        params['projectKey'],
        params['summary'],
        params['description'],
        params['assigneeAccountId'],
        params['priority'],
        params['labels']
      );
      log.info(`✅ Created bug: ${result.key}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_create_bug: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_create_issue',
  {
    projectKey: z.string(),
    summary: z.string(),
    issueTypeId: z.string(),
    description: z.string().optional(),
    assigneeAccountId: z.string().optional(),
    reporterAccountId: z.string().optional(),
    priority: z.string().optional(),
    labels: z.array(z.string()).optional(),
    components: z.array(z.string()).optional(),
    fixVersions: z.array(z.string()).optional(),
  },
  {
    description:
      'Create a new issue in a Jira project. Make sure to use a valid issue type ID for the specific project.',
    examples: [
      {
        name: 'Create a Task',
        input: {
          projectKey: 'FITPULSE',
          summary: 'Implement user authentication',
          issueTypeId: '10035',
          description: 'Add user login and registration functionality',
          labels: ['frontend', 'authentication'],
        },
      },
    ],
  },
  async params => {
    log.info(`🔧 Tool 'jira_create_issue' called with params: ${JSON.stringify(params)}`);
    try {
      // Validate issue type ID is numeric
      const issueTypeId = params['issueTypeId'];
      if (!/^\d+$/.test(issueTypeId)) {
        throw new Error(`Invalid issue type ID: ${issueTypeId}. Must be a numeric ID.`);
      }

      const fields: issueService.IssueField = {
        summary: params['summary'],
        project: {
          key: params['projectKey'],
        },
        issuetype: {
          id: issueTypeId,
        },
      };

      if (params['description']) {
        fields.description = params['description'];
      }

      if (params['assigneeAccountId']) {
        fields.assignee = {
          accountId: params['assigneeAccountId'],
        };
      }

      if (params['reporterAccountId']) {
        fields.reporter = {
          accountId: params['reporterAccountId'],
        };
      }

      if (params['priority']) {
        fields.priority = {
          id: params['priority'],
        };
      }

      if (params['labels'] && params['labels'].length > 0) {
        fields.labels = params['labels'];
      }

      if (params['components'] && params['components'].length > 0) {
        fields.components = params['components'].map(id => ({ id }));
      }

      if (params['fixVersions'] && params['fixVersions'].length > 0) {
        fields.fixVersions = params['fixVersions'].map(id => ({ id }));
      }

      log.info(`📤 Creating issue with fields: ${JSON.stringify(fields, null, 2)}`);
      const result = await issueService.createIssue({ fields });
      log.info(`✅ Created issue: ${result.key}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_create_issue: ${error}`);

      // Enhanced error handling with project-specific issue type validation
      if (error instanceof Error) {
        log.error(`❌ Error message: ${error.message}`);

        if (error.message.includes('Invalid input for createIssue')) {
          log.error(
            `❌ Issue type ID '${params['issueTypeId']}' is not valid for project '${params['projectKey']}'`
          );

          // Try to get project-specific issue types to provide better guidance
          try {
            const projectResponse = await projectService.getProject(params['projectKey']);
            const availableIssueTypes = projectResponse.issueTypes || [];

            if (availableIssueTypes.length > 0) {
              log.error(`❌ Available issue types for project '${params['projectKey']}':`);
              availableIssueTypes.forEach(issueType => {
                log.error(
                  `   - ID: ${issueType.id}, Name: ${issueType.name}${issueType.subtask ? ' (Subtask)' : ''}`
                );
              });

              // Suggest the most appropriate issue type
              const mainIssueTypes = availableIssueTypes.filter(it => !it.subtask);
              if (mainIssueTypes.length > 0) {
                const suggestedType = mainIssueTypes[0];
                if (suggestedType) {
                  log.error(
                    `💡 Suggestion: Use issue type ID '${suggestedType.id}' (${suggestedType.name}) instead`
                  );
                }
              }
            }
          } catch (projectError) {
            log.error(`❌ Could not retrieve project issue types: ${projectError}`);
          }

          log.error(`❌ Use jira_get_project to see available issue types for this project`);
        }

        // Check if it's a scope restriction error
        if (
          error instanceof Error &&
          'context' in error &&
          (error as any).context?.data?.errors?.issuetype
        ) {
          log.error(`❌ Issue type scope error: ${(error as any).context.data.errors.issuetype}`);
        }
      }
      throw error;
    }
  }
);

server.tool(
  'jira_get_issue',
  {
    issueKeyOrId: z.string(),
    expand: z.string().optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_get_issue' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await issueService.getIssue(params['issueKeyOrId'], params['expand']);
      log.info(`✅ Retrieved issue: ${result.key}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_issue: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_search_issues',
  {
    jql: z.string().optional(),
    startAt: z.number().optional(),
    maxResults: z.number().optional(),
    validateQuery: z.boolean().optional(),
    fields: z.array(z.string()).optional(),
    expand: z.array(z.string()).optional(),
    properties: z.array(z.string()).optional(),
    fieldsByKeys: z.boolean().optional(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_search_issues' called with params: ${JSON.stringify(params)}`);
    try {
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      );

      const result = await issueService.searchIssues(filteredParams);
      log.info(`✅ Retrieved ${result.issues.length} issues from search`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_search_issues: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_delete_issue',
  {
    issueKeyOrId: z.string(),
  },
  async params => {
    log.info(`🔧 Tool 'jira_delete_issue' called with params: ${JSON.stringify(params)}`);
    try {
      await issueService.deleteIssue(params['issueKeyOrId']);
      log.info(`✅ Deleted issue: ${params['issueKeyOrId']}`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { message: 'Issue deleted successfully', issueKeyOrId: params['issueKeyOrId'] },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      log.error(`❌ Error in jira_delete_issue: ${error}`);
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

log.info('✅ All tools and resources registered successfully');

// SSE Session Management
const sseSessions = new Map<string, SSEServerTransport>();
const streamableSessions = new Map<string, StreamableHTTPServerTransport>();

async function handleSSE(req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
  if (req.method === 'POST') {
    const sessionId = url.searchParams.get('sessionId');
    log.info(`📨 POST request received for session: ${sessionId || 'unknown'}`);

    if (!sessionId) {
      log.error('❌ Missing sessionId in POST request');
      res.statusCode = 400;
      return res.end('Missing sessionId');
    }

    const transport = sseSessions.get(sessionId);
    if (!transport) {
      log.error(`❌ Session not found: ${sessionId}`);
      res.statusCode = 404;
      return res.end('Session not found');
    }

    log.info(`✅ Processing POST message for session: ${sessionId}`);

    // IMPORTANTE: NO leer el body aquí - dejar que el SDK MCP lo maneje
    // El SDK necesita el stream intacto para procesar correctamente los parámetros
    return await transport.handlePostMessage(req, res);
  } else if (req.method === 'GET') {
    const transport = new SSEServerTransport('/sse', res);
    sseSessions.set(transport.sessionId, transport);

    log.info(`🔌 New SSE connection established: ${transport.sessionId}`);

    log.info(`🔧 Connecting MCP server to SSE transport...`);
    await server.connect(transport);
    log.info(`✅ MCP server connected to SSE transport: ${transport.sessionId}`);
    log.info(
      `📋 Available tools: jira_get_all_boards, jira_create_board, jira_get_board_by_id, jira_delete_board, jira_get_board_backlog, jira_get_board_epics, jira_get_board_sprints, jira_get_board_issues, jira_move_issues_to_board, jira_get_my_filters, jira_get_favourite_filters, jira_search_filters, jira_move_issues_to_backlog, jira_move_issues_to_backlog_for_board, jira_create_project, jira_get_all_projects, jira_get_project, jira_check_project_exists, jira_get_current_user, jira_update_project, jira_delete_project, jira_create_project_with_board, jira_get_issue_types, jira_get_project_issue_types, jira_create_user_story, jira_create_bug, jira_create_issue, jira_get_issue, jira_search_issues, jira_delete_issue`
    );

    res.on('close', () => {
      log.info(`🔌 SSE connection closed: ${transport.sessionId}`);
      sseSessions.delete(transport.sessionId);
    });
    return;
  }

  res.statusCode = 405;
  res.end('Method not allowed');
}

async function handleStreamable(req: http.IncomingMessage, res: http.ServerResponse) {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (sessionId) {
    const transport = streamableSessions.get(sessionId);
    if (!transport) {
      res.statusCode = 404;
      res.end('Session not found');
      return;
    }
    return await transport.handleRequest(req, res);
  }

  if (req.method === 'POST') {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: sessionId => {
        streamableSessions.set(sessionId, transport);
        log.info(`🔌 New Streamable HTTP connection established: ${sessionId}`);
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        log.info(`🔌 Streamable HTTP connection closed: ${transport.sessionId}`);
        streamableSessions.delete(transport.sessionId);
      }
    };

    await Promise.all([server.connect(transport), transport.handleRequest(req, res)]);
    return;
  }

  res.statusCode = 400;
  res.end('Invalid request');
}

export const startSSEServer = async (port: number = 3001) => {
  log.info(`🔌 Starting Jira MCP SSE server on port ${port}...`);

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(`http://localhost${req.url || ''}`);

    // Add CORS headers for web clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    log.info(`📡 Request: ${req.method} ${url.pathname}`);

    if (url.pathname.startsWith('/mcp')) {
      await handleStreamable(req, res);
    } else if (url.pathname === '/sse' || url.pathname === '/') {
      await handleSSE(req, res, url);
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  });

  httpServer.listen(port, () => {
    const address = httpServer.address();
    if (!address) {
      log.error('❌ Could not bind server socket');
      return;
    }

    let url: string;
    if (typeof address === 'string') {
      url = address;
    } else {
      const resolvedPort = address.port;
      let resolvedHost = address.family === 'IPv4' ? address.address : `[${address.address}]`;
      if (resolvedHost === '0.0.0.0' || resolvedHost === '[::]') resolvedHost = 'localhost';
      url = `http://${resolvedHost}:${resolvedPort}`;
    }

    log.success(`✅ Jira MCP SSE server listening on ${url}`);
    log.info('📋 Cursor configuration:');
    log.info(
      JSON.stringify(
        {
          mcpServers: {
            'jira-mcp-server': {
              url: `${url}/sse`,
            },
          },
        },
        undefined,
        2
      )
    );
    log.info('🌐 For streamable HTTP support, use the /mcp endpoint instead.');
  });

  return httpServer;
};

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1] || ''}`) {
  const port = parseInt(process.argv[2] || '3001') || 3001;
  startSSEServer(port).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}
