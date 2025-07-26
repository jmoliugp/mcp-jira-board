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
import * as estimationService from '../services/jira/estimation.js';
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
    projectKey: z.string().describe('The project key (e.g., "FITPULSE") to get issue types for'),
  },
  {
    description:
      'Get available issue types for a specific project. This is more useful than jira_get_issue_types as it shows only the issue types that can be used in the specified project. Use this to see what types of issues (Story, Bug, Task, etc.) are available when creating issues in a project.',
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
    projectKey: z.string().describe('The project key (e.g., "FITPULSE") where to create the story'),
    summary: z.string().describe('The story summary/title (max 255 characters)'),
    description: z.string().optional().describe('Optional story description (supports markdown)'),
    assigneeAccountId: z
      .string()
      .optional()
      .describe(
        'Account ID of the user to assign the story to (e.g., "557058:ce35284a-81a1-48bd-a3db-4adfcf673ad5")'
      ),
    storyPoints: z.number().optional().describe('Story points for estimation (e.g., 3, 5, 8, 13)'),
    labels: z
      .array(z.string())
      .optional()
      .describe(
        'Optional labels for categorization (e.g., ["frontend", "urgent"]) - TEMPORARILY DISABLED'
      ),
  },
  {
    description:
      'Create a user story in a Jira project. The function will automatically find the best available issue type (Story, Task, etc.) for the project. If no Story type is available, it will use the first available main issue type. Note: Labels are temporarily disabled due to field configuration issues.',
    examples: [
      {
        name: 'Create User Story for FITPULSE',
        input: {
          projectKey: 'FITPULSE',
          summary: 'Setup project structure and development environment',
          description:
            'As a developer, I need to set up the initial project structure and development environment so that I can start building the application efficiently.',
          assigneeAccountId: '557058:ce35284a-81a1-48bd-a3db-4adfcf673ad5',
          storyPoints: 5,
          // labels: ['landing-page', 'frontend'], // Temporarily disabled
        },
      },
    ],
  },
  async params => {
    log.info(`🔧 Tool 'jira_create_user_story' called with params: ${JSON.stringify(params)}`);
    try {
      // Note: Labels are temporarily disabled due to field configuration issues
      const result = await issueService.createUserStory(
        params['projectKey'],
        params['summary'],
        params['description'],
        params['assigneeAccountId'],
        params['storyPoints'],
        undefined // params['labels'] - temporarily disabled
      );
      log.info(`✅ Created user story: ${result.key}`);

      // Add helpful information about the created issue
      const response = {
        ...result,
        note:
          params['labels'] && params['labels'].length > 0
            ? `Note: Labels were provided but are temporarily disabled due to field configuration issues.`
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
    projectKey: z.string().describe('The project key (e.g., "FITPULSE") where to create the bug'),
    summary: z.string().describe('The bug summary/title (max 255 characters)'),
    description: z.string().optional().describe('Optional bug description (supports markdown)'),
    assigneeAccountId: z
      .string()
      .optional()
      .describe(
        'Account ID of the user to assign the bug to (e.g., "557058:ce35284a-81a1-48bd-a3db-4adfcf673ad5")'
      ),
    priority: z
      .string()
      .optional()
      .describe('Priority ID: 1 (Highest), 2 (High), 3 (Medium), 4 (Low), 5 (Lowest)'),
    labels: z
      .array(z.string())
      .optional()
      .describe(
        'Optional labels for categorization (e.g., ["critical", "frontend"]) - TEMPORARILY DISABLED'
      ),
  },
  async params => {
    log.info(`🔧 Tool 'jira_create_bug' called with params: ${JSON.stringify(params)}`);
    try {
      // Note: Labels are temporarily disabled due to field configuration issues
      const result = await issueService.createBug(
        params['projectKey'],
        params['summary'],
        params['description'],
        params['assigneeAccountId'],
        params['priority'],
        undefined // params['labels'] - temporarily disabled
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
    projectKey: z.string().describe('The project key (e.g., "FITPULSE") where to create the issue'),
    summary: z.string().describe('The issue summary/title (max 255 characters)'),
    issueTypeId: z
      .string()
      .describe(
        'Numeric ID of the issue type (use jira_get_project_issue_types to see available IDs)'
      ),
    description: z.string().optional().describe('Optional issue description (supports markdown)'),
    assigneeAccountId: z
      .string()
      .optional()
      .describe(
        'Account ID of the user to assign the issue to (e.g., "557058:ce35284a-81a1-48bd-a3db-4adfcf673ad5")'
      ),
    reporterAccountId: z.string().optional().describe('Account ID of the user reporting the issue'),
    priority: z
      .string()
      .optional()
      .describe('Priority ID: 1 (Highest), 2 (High), 3 (Medium), 4 (Low), 5 (Lowest)'),
    labels: z
      .array(z.string())
      .optional()
      .describe(
        'Optional labels for categorization (e.g., ["frontend", "urgent"]) - TEMPORARILY DISABLED'
      ),
    components: z
      .array(z.string())
      .optional()
      .describe('Optional component IDs (use project components)'),
    fixVersions: z
      .array(z.string())
      .optional()
      .describe('Optional fix version IDs (use project versions)'),
  },
  {
    description:
      'Create a new issue in a Jira project with any issue type. Use jira_get_project_issue_types first to see available issue types and their IDs for the specific project. This is more flexible than jira_create_user_story or jira_create_bug. Note: Labels are temporarily disabled due to field configuration issues.',
    examples: [
      {
        name: 'Create a Task',
        input: {
          projectKey: 'FITPULSE',
          summary: 'Implement user authentication',
          issueTypeId: '10035',
          description: 'Add user login and registration functionality with OAuth2 support',
          assigneeAccountId: '557058:ce35284a-81a1-48bd-a3db-4adfcf673ad5',
          priority: '2',
          // labels: ['frontend', 'authentication'], // Temporarily disabled
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

      // Labels temporarily disabled to avoid field configuration issues
      // if (params['labels'] && params['labels'].length > 0) {
      //   fields.labels = params['labels'];
      // }

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
  'jira_validate_jql',
  {
    jql: z.string().describe('The JQL query to validate'),
  },
  {
    description:
      'Validate a JQL query and get suggestions for improvement. This helps identify potential issues before executing a search.',
    examples: [
      {
        name: 'Validate JQL Query',
        input: {
          jql: 'project = FITPULSE AND "Story Points" is EMPTY',
        },
      },
    ],
  },
  async params => {
    log.info(`🔧 Tool 'jira_validate_jql' called with params: ${JSON.stringify(params)}`);
    try {
      const jql = params['jql'];
      const suggestions: string[] = [];

      // Check for common field name issues
      if (jql.includes('"Story Points"')) {
        suggestions.push(
          'The field "Story Points" may not exist. Try using "timeoriginalestimate" instead.'
        );
        suggestions.push('Alternative query: project = FITPULSE AND timeoriginalestimate is EMPTY');
      }

      if (jql.includes('"Story Points"') && jql.includes('is EMPTY')) {
        suggestions.push('Try using "is null" instead of "is EMPTY" for time fields.');
      }

      // Check for project key issues
      if (jql.includes('project =') && !jql.includes('project = FITPULSE')) {
        suggestions.push('Make sure the project key is correct and exists.');
      }

      // Check for field name issues
      if (jql.includes('"') && jql.includes('is EMPTY')) {
        suggestions.push(
          'Custom field names in quotes may not exist. Try using standard field names.'
        );
      }

      // Check for basic JQL syntax
      if (!jql.includes('project =')) {
        suggestions.push('JQL queries should typically start with "project = PROJECT_KEY"');
      }

      const result = {
        jql,
        isValid: suggestions.length === 0,
        suggestions,
        recommendedQueries: [
          'project = FITPULSE',
          'project = FITPULSE AND status != Done',
          'project = FITPULSE AND timeoriginalestimate is EMPTY',
          'project = FITPULSE AND assignee is EMPTY',
        ],
      };

      log.info(`✅ JQL validation completed: ${result.isValid ? 'Valid' : 'Issues found'}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_validate_jql: ${error}`);
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

      // Enhanced error handling for JQL issues
      if (error instanceof Error) {
        log.error(`❌ Error message: ${error.message}`);

        // Check if it's a JQL validation error
        if (error.message.includes('Invalid input for searchIssues')) {
          log.error(`❌ JQL validation error for query: ${params['jql']}`);

          // Provide helpful suggestions for common JQL issues
          if (params['jql'] && params['jql'].includes('Story Points')) {
            log.error(`❌ The field "Story Points" may not exist or be configured in this project`);
            log.error(
              `💡 Try using a simpler JQL query like: "project = ${params['jql']?.split(' ')[2] || 'FITPULSE'}"`
            );
            log.error(
              `💡 Or search for issues without story points using: "project = ${params['jql']?.split(' ')[2] || 'FITPULSE'} AND timeoriginalestimate is EMPTY"`
            );
          }

          if (params['jql'] && params['jql'].includes('is EMPTY')) {
            log.error(`❌ The "is EMPTY" operator may not work with the specified field`);
            log.error(`💡 Try using "is null" instead of "is EMPTY"`);
          }
        }

        // Log the full error context if available
        if ('context' in error && (error as any).context) {
          log.error(`❌ Error context: ${JSON.stringify((error as any).context, null, 2)}`);
        }
      }
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

server.tool(
  'jira_get_issue_transitions',
  {
    issueKeyOrId: z
      .string()
      .describe('The issue key (e.g., "PROJ-123") or ID to get transitions for'),
  },
  {
    description:
      'Get all available status transitions for a specific issue. This shows what status changes are possible from the current status and provides the transition IDs needed for jira_update_issue. Use this before changing issue status to see valid options.',
    examples: [
      {
        name: 'Get Transitions for FITPULSE-123',
        input: {
          issueKeyOrId: 'FITPULSE-123',
        },
      },
    ],
  },
  async params => {
    log.info(`🔧 Tool 'jira_get_issue_transitions' called with params: ${JSON.stringify(params)}`);
    try {
      const result = await issueService.getIssueTransitions(params['issueKeyOrId']);
      log.info(
        `✅ Retrieved ${result.transitions.length} transitions for issue: ${params['issueKeyOrId']}`
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_issue_transitions: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_update_issue',
  {
    issueKeyOrId: z.string().describe('The issue key (e.g., "PROJ-123") or ID to update'),
    assigneeAccountId: z
      .string()
      .optional()
      .describe(
        'Account ID of the user to assign the issue to (e.g., "557058:ce35284a-81a1-48bd-a3db-4adfcf673ad5")'
      ),
    priorityId: z
      .string()
      .optional()
      .describe('Priority ID: 1 (Highest), 2 (High), 3 (Medium), 4 (Low), 5 (Lowest)'),
    transitionId: z
      .string()
      .optional()
      .describe(
        'Transition ID to change issue status (use jira_get_issue_transitions to see available options)'
      ),
    comment: z
      .string()
      .optional()
      .describe('Comment to add to the issue (supports markdown and emojis)'),
    summary: z.string().optional().describe('New summary/title for the issue'),
    description: z.string().optional().describe('New description for the issue'),
    unassign: z
      .boolean()
      .optional()
      .describe('Set to true to remove the current assignee (overrides assigneeAccountId)'),
  },
  {
    description:
      'Update an existing issue with new assignee, priority, status, summary, description, and/or comments. You can update multiple fields at once. For status changes, use jira_get_issue_transitions first to see available transitions. Common priority IDs: 1=Highest, 2=High, 3=Medium, 4=Low, 5=Lowest.',
    examples: [
      {
        name: 'Update Issue Assignee and Add Comment',
        input: {
          issueKeyOrId: 'FITPULSE-123',
          assigneeAccountId: '557058:ce35284a-81a1-48bd-a3db-4adfcf673ad5',
          comment: 'Assigned to development team for implementation 🚀',
        },
      },
      {
        name: 'Change Issue Status to In Progress',
        input: {
          issueKeyOrId: 'FITPULSE-123',
          transitionId: '21',
          comment: 'Starting work on this feature',
        },
      },
      {
        name: 'Update Priority and Add Comment',
        input: {
          issueKeyOrId: 'FITPULSE-123',
          priorityId: '1',
          comment: 'Escalated to highest priority due to customer impact',
        },
      },
      {
        name: 'Unassign Issue',
        input: {
          issueKeyOrId: 'FITPULSE-123',
          unassign: true,
          comment: 'Unassigned for review and reassignment',
        },
      },
    ],
  },
  async params => {
    log.info(`🔧 Tool 'jira_update_issue' called with params: ${JSON.stringify(params)}`);
    try {
      const updateInput: issueService.UpdateIssueInput = {};

      // Handle fields updates
      if (
        params['summary'] ||
        params['description'] ||
        params['assigneeAccountId'] ||
        params['priorityId'] ||
        params['unassign']
      ) {
        updateInput.fields = {};

        if (params['summary']) {
          updateInput.fields.summary = params['summary'];
        }

        if (params['description']) {
          updateInput.fields.description = params['description'];
        }

        if (params['assigneeAccountId']) {
          updateInput.fields.assignee = {
            accountId: params['assigneeAccountId'],
          };
        }

        if (params['unassign']) {
          updateInput.fields.assignee = null;
        }

        if (params['priorityId']) {
          updateInput.fields.priority = {
            id: params['priorityId'],
          };
        }
      }

      // Handle status transition
      if (params['transitionId']) {
        updateInput.transition = {
          id: params['transitionId'],
        };
      }

      // Handle comment
      if (params['comment']) {
        updateInput.update = {
          comment: [
            {
              add: {
                body: params['comment'],
              },
            },
          ],
        };
      }

      // Jira requires at least one of 'fields' or 'update' when making transitions
      // If only transition is provided, add an empty update object
      if (updateInput.transition && !updateInput.fields && !updateInput.update) {
        updateInput.update = {};
      }

      log.info(`📤 Updating issue with: ${JSON.stringify(updateInput, null, 2)}`);
      const result = await issueService.updateIssue(params['issueKeyOrId'], updateInput);
      log.info(`✅ Updated issue: ${result.key}`);

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_update_issue: ${error}`);

      // Enhanced error handling for common update scenarios
      if (error instanceof Error) {
        log.error(`❌ Error message: ${error.message}`);

        // Check if it's a transition error
        if (error.message.includes('transition') || error.message.includes('status')) {
          log.error(
            `❌ Invalid transition ID. Use jira_get_issue_transitions to see available transitions.`
          );
        }

        // Check if it's an assignee error
        if (error.message.includes('assignee') || error.message.includes('user')) {
          log.error(
            `❌ Invalid assignee. Make sure the user account ID is correct and the user has access to the project.`
          );
        }

        // Check if it's a priority error
        if (error.message.includes('priority')) {
          log.error(
            `❌ Invalid priority ID. Common priority IDs: 1 (Highest), 2 (High), 3 (Medium), 4 (Low), 5 (Lowest)`
          );
        }
      }

      throw error;
    }
  }
);

// Story Estimation Tools

server.tool(
  'jira_ai_estimate_stories_in_project',
  {
    projectKey: z.string().describe('The project key (e.g., "FITPULSE") to estimate stories for'),
    defaultStoryPoints: z
      .number()
      .optional()
      .describe('Default story points to assign (defaults to 3)'),
    estimationLabel: z
      .string()
      .optional()
      .describe('Label to add to estimated stories (defaults to "ai-estimation")'),
    maxResults: z
      .number()
      .optional()
      .describe('Maximum number of stories to process (defaults to 100)'),
  },
  {
    description:
      'AI-powered automatic estimation of all unestimated stories in a project by assigning default story points and adding an AI estimation label. This tool will find all stories without story points, estimate them with the specified default value, and add a label to track which stories were automatically estimated by AI.',
    examples: [
      {
        name: 'AI Estimate Stories with Default Points',
        input: {
          projectKey: 'FITPULSE',
        },
      },
      {
        name: 'AI Estimate Stories with Custom Points',
        input: {
          projectKey: 'FITPULSE',
          defaultStoryPoints: 5,
          estimationLabel: 'ai-estimated',
        },
      },
    ],
  },
  async params => {
    log.info(
      `🔧 Tool 'jira_ai_estimate_stories_in_project' called with params: ${JSON.stringify(params)}`
    );
    try {
      const estimationParams: estimationService.EstimateStoriesParams = {
        projectKey: params['projectKey'],
        ...(params['defaultStoryPoints'] !== undefined && {
          defaultStoryPoints: params['defaultStoryPoints'],
        }),
        ...(params['estimationLabel'] !== undefined && {
          estimationLabel: params['estimationLabel'],
        }),
        ...(params['maxResults'] !== undefined && { maxResults: params['maxResults'] }),
      };

      const result = await estimationService.estimateStoriesInProject(estimationParams);

      log.info(`✅ AI story estimation completed for project ${params['projectKey']}`);
      log.info(
        `📊 Results: ${result.estimatedStories} AI-estimated, ${result.failedEstimations} failed`
      );

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_ai_estimate_stories_in_project: ${error}`);
      throw error;
    }
  }
);

server.tool(
  'jira_get_project_ai_estimation_stats',
  {
    projectKey: z
      .string()
      .describe('The project key (e.g., "FITPULSE") to get estimation statistics for'),
  },
  {
    description:
      'Get AI estimation statistics for a project, including total stories, estimated vs unestimated counts, AI-estimated stories, and average story points. This is useful for understanding the current state of AI story estimation in a project.',
    examples: [
      {
        name: 'Get FITPULSE Project AI Estimation Stats',
        input: {
          projectKey: 'FITPULSE',
        },
      },
    ],
  },
  async params => {
    log.info(
      `🔧 Tool 'jira_get_project_ai_estimation_stats' called with params: ${JSON.stringify(params)}`
    );
    try {
      const stats = await estimationService.getProjectEstimationStats(params['projectKey']);

      log.info(`📊 Retrieved AI estimation stats for project ${params['projectKey']}`);
      log.info(
        `📈 Stats: ${stats.totalStories} total, ${stats.estimatedStories} estimated, ${stats.aiEstimatedStories} AI-estimated`
      );

      return {
        content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
      };
    } catch (error) {
      log.error(`❌ Error in jira_get_project_ai_estimation_stats: ${error}`);
      throw error;
    }
  }
);

// Field Configuration Tools - REMOVED
// These tools have been removed to simplify the codebase and avoid custom field issues

// Custom Field Tools - REMOVED
// These tools have been removed to simplify the codebase and avoid custom field issues

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
      `📋 Available tools: jira_get_all_boards, jira_create_board, jira_get_board_by_id, jira_delete_board, jira_get_board_backlog, jira_get_board_epics, jira_get_board_sprints, jira_get_board_issues, jira_move_issues_to_board, jira_get_my_filters, jira_get_favourite_filters, jira_search_filters, jira_move_issues_to_backlog, jira_move_issues_to_backlog_for_board, jira_create_project, jira_get_all_projects, jira_get_project, jira_check_project_exists, jira_get_current_user, jira_update_project, jira_delete_project, jira_create_project_with_board, jira_get_issue_types, jira_get_project_issue_types, jira_create_user_story, jira_create_bug, jira_create_issue, jira_get_issue, jira_search_issues, jira_validate_jql, jira_delete_issue, jira_get_issue_transitions, jira_update_issue, jira_ai_estimate_stories_in_project, jira_get_project_ai_estimation_stats`
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
