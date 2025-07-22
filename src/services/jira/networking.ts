import axios from 'axios';
import { config } from '../../utils/config';

export const jiraApiEndpoint = {
  backlog: {
    moveIssuesToBacklog: '/rest/agile/1.0/backlog/issue',
    moveIssuesToBacklogForBoard: '/rest/agile/1.0/backlog/%s/issue',
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
