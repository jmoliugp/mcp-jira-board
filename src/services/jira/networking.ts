import axios from 'axios';
import { config } from '../../utils/config.js';

export const jiraApiEndpoint = {
  backlog: {
    moveIssuesToBacklog: '/rest/agile/1.0/backlog/issue',
    moveIssuesToBacklogForBoard: '/rest/agile/1.0/backlog/%s/issue',
  },
  board: {
    getAllBoards: '/rest/agile/1.0/board',
    createBoard: '/rest/agile/1.0/board',
    getBoardById: '/rest/agile/1.0/board/%s',
    deleteBoard: '/rest/agile/1.0/board/%s',
    getBoardByFilterId: '/rest/agile/1.0/board/filter/%s',
    getBoardBacklog: '/rest/agile/1.0/board/%s/backlog',
    getBoardConfiguration: '/rest/agile/1.0/board/%s/configuration',
    getBoardEpics: '/rest/agile/1.0/board/%s/epic',
    getBoardEpicNoneIssues: '/rest/agile/1.0/board/%s/epic/none/issue',
    getBoardEpicIssues: '/rest/agile/1.0/board/%s/epic/%s/issue',
    getBoardFeatures: '/rest/agile/1.0/board/%s/features',
    updateBoardFeatures: '/rest/agile/1.0/board/%s/features',
    getBoardIssues: '/rest/agile/1.0/board/%s/issue',
    moveIssuesToBoard: '/rest/agile/1.0/board/%s/issue',
    getBoardProjects: '/rest/agile/1.0/board/%s/project',
    getBoardProjectsFull: '/rest/agile/1.0/board/%s/project/full',
    getBoardProperties: '/rest/agile/1.0/board/%s/properties',
    getBoardProperty: '/rest/agile/1.0/board/%s/properties/%s',
    setBoardProperty: '/rest/agile/1.0/board/%s/properties/%s',
    deleteBoardProperty: '/rest/agile/1.0/board/%s/properties/%s',
    getBoardQuickFilters: '/rest/agile/1.0/board/%s/quickfilter',
    getBoardQuickFilter: '/rest/agile/1.0/board/%s/quickfilter/%s',
    getBoardReports: '/rest/agile/1.0/board/%s/reports',
    getBoardSprints: '/rest/agile/1.0/board/%s/sprint',
    getBoardSprintIssues: '/rest/agile/1.0/board/%s/sprint/%s/issue',
    getBoardVersions: '/rest/agile/1.0/board/%s/version',
  },
  filter: {
    getMyFilters: '/rest/api/3/filter/my',
    getFavouriteFilters: '/rest/api/3/filter/favourite',
    searchFilters: '/rest/api/3/filter/search',
    createFilter: '/rest/api/3/filter',
    getFilter: '/rest/api/3/filter/%s',
  },
  project: {
    createProject: '/rest/api/3/project',
    getAllProjects: '/rest/api/3/project',
    getProject: '/rest/api/3/project/%s',
    updateProject: '/rest/api/3/project/%s',
    deleteProject: '/rest/api/3/project/%s',
    getProjectComponents: '/rest/api/3/project/%s/components',
    getProjectVersions: '/rest/api/3/project/%s/versions',
    getProjectRoles: '/rest/api/3/project/%s/role',
    getProjectRole: '/rest/api/3/project/%s/role/%s',
    getProjectUsers: '/rest/api/3/project/%s/role/%s',
    getProjectFieldConfiguration: '/rest/api/3/fieldconfiguration/project/%s',
    getProjectScreenSchemes: '/rest/api/3/screenscheme/project/%s',
    getProjectFieldConfigurationSchemes: '/rest/api/3/fieldconfigurationscheme/project/%s',
  },
  user: {
    getCurrentUser: '/rest/api/3/myself',
  },
  issue: {
    createIssue: '/rest/api/3/issue',
    getIssue: '/rest/api/3/issue/%s',
    updateIssue: '/rest/api/3/issue/%s',
    deleteIssue: '/rest/api/3/issue/%s',
    searchIssues: '/rest/api/3/search',
    getIssueTypes: '/rest/api/3/issuetype',
    getIssueType: '/rest/api/3/issuetype/%s',
    getIssueTransitions: '/rest/api/3/issue/%s/transitions',
  },
  field: {
    getFields: '/rest/api/3/field',
    createCustomField: '/rest/api/3/field',
    getField: '/rest/api/3/field/%s',
    updateField: '/rest/api/3/field/%s',
    deleteField: '/rest/api/3/field/%s',
  },
};

export const axiosClient = axios.create({
  baseURL: config.jira.baseUrl,
  auth: {
    username: config.jira.email,
    password: config.jira.apiToken,
  },
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: config.jira.apiTimeout,
});

axiosClient.interceptors.request.use(/* logging */);
axiosClient.interceptors.response.use(/* logging */);
