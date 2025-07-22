import axios from 'axios';
import { config } from '../../utils/config';

export const jiraApiEndpoint = {
  backlog: {
    moveIssuesToBacklog: '/rest/agile/1.0/backlog/issue',
    moveIssuesToBacklogForBoard: '/rest/agile/1.0/backlog/%s/issue',
  },
  // --- Board endpoints ---
  board: {
    getAllBoards: '/rest/agile/1.0/board',
    createBoard: '/rest/agile/1.0/board',
    getBoardById: '/rest/agile/1.0/board/%s',
    deleteBoard: '/rest/agile/1.0/board/%s',
    getBoardByFilterId: '/rest/agile/1.0/board/filter/%s',
    getBoardBacklog: '/rest/agile/1.0/board/%s/backlog',
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
