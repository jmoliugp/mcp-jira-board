import axios from 'axios';
import { config } from '../../utils/config';

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
});

axiosClient.interceptors.request.use(/* logging */);
axiosClient.interceptors.response.use(/* logging */);
