// Ref: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-filters/

import { format } from 'util';
import { axiosClient, jiraApiEndpoint } from './networking.js';
import {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from '../../utils/error.js';
import { AxiosError } from 'axios';
import { performance } from 'perf_hooks';
import { Logger } from '../../utils/log.js';

const log = new Logger('jira/filter');

export interface Filter {
  id: string;
  name: string;
  description?: string;
  owner: {
    accountId: string;
    displayName: string;
    active: boolean;
  };
  jql: string;
  viewUrl: string;
  searchUrl: string;
  favourite: boolean;
  favouritedCount: number;
  sharePermissions: any[];
  editPermissions: any[];
  isWritable: boolean;
  subscriptions: any[];
}

export interface GetMyFiltersResponse {
  values: Filter[];
}

export interface GetFavouriteFiltersResponse {
  values: Filter[];
}

export interface SearchFiltersParams {
  filterName?: string;
  accountId?: string;
  owner?: string;
  groupname?: string;
  projectId?: number;
  id?: number;
  orderBy?: string;
  startAt?: number;
  maxResults?: number;
  expand?: string;
}

export interface SearchFiltersResponse {
  values: Filter[];
  startAt: number;
  maxResults: number;
  total: number;
}

export interface CreateFilterInput {
  name: string;
  description?: string;
  jql: string;
  favourite?: boolean;
}

export interface CreateFilterResponse extends Filter {
  // Same as Filter interface
}

/**
 * Get filters owned by the current user.
 * @returns List of filters owned by the current user
 */
export const getMyFilters = async (): Promise<GetMyFiltersResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetMyFiltersResponse>(
      jiraApiEndpoint.filter.getMyFilters
    );
    const end = performance.now();
    log.info(`⏱️ getMyFilters executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, endpoint: jiraApiEndpoint.filter.getMyFilters };

    if (status === 400) throw new UserInputError('Invalid input for getMyFilters.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getMyFilters.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getMyFilters.', context);
    if (status === 404) throw new NotFoundError('Filters not found.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getMyFilters.', context);
    throw new InternalServerError('Unexpected error in getMyFilters.', context);
  }
};

/**
 * Get favourite filters for the current user.
 * @returns List of favourite filters
 */
export const getFavouriteFilters = async (): Promise<GetFavouriteFiltersResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<GetFavouriteFiltersResponse>(
      jiraApiEndpoint.filter.getFavouriteFilters
    );
    const end = performance.now();
    log.info(`⏱️ getFavouriteFilters executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, endpoint: jiraApiEndpoint.filter.getFavouriteFilters };

    if (status === 400) throw new UserInputError('Invalid input for getFavouriteFilters.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getFavouriteFilters.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for getFavouriteFilters.', context);
    if (status === 404) throw new NotFoundError('Favourite filters not found.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getFavouriteFilters.', context);
    throw new InternalServerError('Unexpected error in getFavouriteFilters.', context);
  }
};

/**
 * Get a specific filter by ID.
 * @param filterId - The filter ID
 * @returns Filter details
 */
export const getFilter = async (filterId: string): Promise<Filter> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<Filter>(
      format(jiraApiEndpoint.filter.getFilter, filterId)
    );
    const end = performance.now();
    log.info(`⏱️ getFilter executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      filterId,
      endpoint: format(jiraApiEndpoint.filter.getFilter, filterId),
    };

    if (status === 400) throw new UserInputError('Invalid input for getFilter.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getFilter.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getFilter.', context);
    if (status === 404) throw new NotFoundError('Filter not found.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getFilter.', context);
    throw new InternalServerError('Unexpected error in getFilter.', context);
  }
};

/**
 * Search for filters with optional parameters.
 * @param params - Search parameters
 * @returns Search results with pagination
 */
export const searchFilters = async (
  params: SearchFiltersParams = {}
): Promise<SearchFiltersResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.get<SearchFiltersResponse>(
      jiraApiEndpoint.filter.searchFilters,
      { params }
    );
    const end = performance.now();
    log.info(`⏱️ searchFilters executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, params, endpoint: jiraApiEndpoint.filter.searchFilters };

    if (status === 400) throw new UserInputError('Invalid input for searchFilters.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for searchFilters.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for searchFilters.', context);
    if (status === 404) throw new NotFoundError('Filters not found.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in searchFilters.', context);
    throw new InternalServerError('Unexpected error in searchFilters.', context);
  }
};

/**
 * Create a new filter.
 * @param input - Filter creation parameters
 * @returns Created filter details
 */
export const createFilter = async (input: CreateFilterInput): Promise<CreateFilterResponse> => {
  const start = performance.now();
  try {
    const { data } = await axiosClient.post<CreateFilterResponse>(
      jiraApiEndpoint.filter.createFilter,
      input
    );
    const end = performance.now();
    log.info(`⏱️ createFilter executed in ${(end - start).toFixed(2)}ms`);
    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = { status, data, input, endpoint: jiraApiEndpoint.filter.createFilter };

    if (status === 400) throw new UserInputError('Invalid input for createFilter.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for createFilter.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for createFilter.', context);
    if (status === 404) throw new NotFoundError('Resource not found for createFilter.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in createFilter.', context);
    throw new InternalServerError('Unexpected error in createFilter.', context);
  }
};

/**
 * Get or create a default filter for board creation.
 * This filter includes all issues that the user has permission to view.
 * @returns Filter ID that can be used for board creation
 */
export const getOrCreateDefaultFilter = async (): Promise<number> => {
  try {
    // First, try to find an existing filter that includes all issues
    const myFilters = await getMyFilters();
    const allIssuesFilter = myFilters.values.find(
      filter =>
        filter.jql.toLowerCase().includes('order by') && filter.jql.toLowerCase().includes('rank')
    );

    if (allIssuesFilter) {
      log.info(
        `✅ Found existing default filter: ${allIssuesFilter.name} (ID: ${allIssuesFilter.id})`
      );
      return parseInt(allIssuesFilter.id);
    }

    // If no suitable filter exists, create one
    log.info(`🔧 Creating default filter for board creation...`);
    const newFilter = await createFilter({
      name: 'MCP Default Board Filter',
      description: 'Default filter created by MCP server for board creation',
      jql: 'ORDER BY Rank ASC',
      favourite: false,
    });

    log.info(`✅ Created default filter: ${newFilter.name} (ID: ${newFilter.id})`);
    return parseInt(newFilter.id);
  } catch (error) {
    log.error(`❌ Error getting/creating default filter: ${error}`);
    // Fallback to a common filter ID (this might not work in all cases)
    return 10000;
  }
};
