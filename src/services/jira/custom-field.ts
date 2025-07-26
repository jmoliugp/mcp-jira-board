// Ref: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-fields/

import { axiosClient, jiraApiEndpoint } from './networking.js';
import {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
  InternalServerError,
} from '../../utils/error.js';
import { AxiosError } from 'axios';
import { performance } from 'perf_hooks';
import { Logger } from '../../utils/log.js';

const log = new Logger('jira/custom-field');

export interface Field {
  id: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
  schema?: {
    type: string;
    custom?: string;
    customId?: number;
  };
}

export interface CreateCustomFieldInput {
  name: string;
  description?: string;
  type:
    | 'com.atlassian.jira.plugin.system.customfieldtypes:number'
    | 'com.atlassian.jira.plugin.system.customfieldtypes:textfield'
    | 'com.atlassian.jira.plugin.system.customfieldtypes:textarea';
  searcherKey?: string;
}

// Field type to searcher mapping
const FIELD_TYPE_SEARCHER_MAP = {
  'com.atlassian.jira.plugin.system.customfieldtypes:number':
    'com.atlassian.jira.plugin.system.customfieldtypes:exactnumber',
  'com.atlassian.jira.plugin.system.customfieldtypes:textfield':
    'com.atlassian.jira.plugin.system.customfieldtypes:exacttextsearcher',
  'com.atlassian.jira.plugin.system.customfieldtypes:textarea':
    'com.atlassian.jira.plugin.system.customfieldtypes:exacttextsearcher',
} as const;

export interface CreateCustomFieldPayload {
  name: string;
  description?: string;
  type: string;
  searcherKey?: string;
  contexts?: {
    projectIds?: string[];
    issueTypeIds?: string[];
  };
}

export interface JiraCustomFieldPayload {
  name: string;
  description?: string;
  type: string;
  searcherKey?: string;
}

/**
 * Get all fields in Jira
 * @returns Array of fields
 */
export const getFields = async (): Promise<Field[]> => {
  const start = performance.now();

  try {
    const { data } = await axiosClient.get<Field[]>(jiraApiEndpoint.field.getFields);

    const end = performance.now();
    log.info(`⏱️ getFields executed in ${(end - start).toFixed(2)}ms`);

    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      endpoint: jiraApiEndpoint.field.getFields,
    };

    if (status === 400) throw new UserInputError('Invalid input for getFields.', context);
    if (status === 401)
      throw new AuthenticationError('Authentication failed for getFields.', context);
    if (status === 403) throw new ForbiddenError('Access forbidden for getFields.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in getFields.', context);
    throw new InternalServerError('Unexpected error in getFields.', context);
  }
};

/**
 * Create a custom field
 * @param input - Custom field creation parameters
 * @returns Created field
 */
export const createCustomField = async (input: CreateCustomFieldInput): Promise<Field> => {
  const start = performance.now();

  try {
    log.info(`🔧 Creating custom field: ${input.name} (${input.type})`);

    // Transform input to Jira API format
    const payload: JiraCustomFieldPayload = {
      name: input.name,
      type: input.type,
      ...(input.description && { description: input.description }),
      ...(input.searcherKey && { searcherKey: input.searcherKey }),
      // Auto-set searcherKey if not provided
      ...(!input.searcherKey && { searcherKey: FIELD_TYPE_SEARCHER_MAP[input.type] }),
    };

    log.info(`📤 Sending payload to Jira API: ${JSON.stringify(payload, null, 2)}`);

    const { data } = await axiosClient.post<Field>(
      jiraApiEndpoint.field.createCustomField,
      payload
    );

    const end = performance.now();
    log.info(`⏱️ createCustomField executed in ${(end - start).toFixed(2)}ms`);
    log.info(`✅ Created custom field: ${data.name} (ID: ${data.id})`);

    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      input,
      endpoint: jiraApiEndpoint.field.createCustomField,
    };

    log.error(`❌ Custom field creation failed with status: ${status}`);
    log.error(`❌ Error response: ${JSON.stringify(data, null, 2)}`);

    if (status === 400) {
      log.error(`❌ Jira API validation error: ${JSON.stringify(data, null, 2)}`);
      throw new UserInputError('Invalid input for createCustomField.', context);
    }
    if (status === 401)
      throw new AuthenticationError('Authentication failed for createCustomField.', context);
    if (status === 403)
      throw new ForbiddenError('Access forbidden for createCustomField.', context);
    if (status && status >= 500)
      throw new InternalServerError('Internal server error in createCustomField.', context);
    throw new InternalServerError('Unexpected error in createCustomField.', context);
  }
};

/**
 * Find a custom field by name
 * @param fieldName - The name of the field to find
 * @returns Field if found, null otherwise
 */
export const findCustomFieldByName = async (fieldName: string): Promise<Field | null> => {
  const start = performance.now();

  try {
    log.info(`🔍 Searching for custom field: ${fieldName}`);

    const fields = await getFields();
    const field = fields.find(f => f.name.toLowerCase() === fieldName.toLowerCase() && f.custom);

    const end = performance.now();
    if (field) {
      log.info(`✅ Found custom field: ${field.name} (ID: ${field.id})`);
    } else {
      log.info(`ℹ️ Custom field not found: ${fieldName}`);
    }
    log.info(`⏱️ findCustomFieldByName executed in ${(end - start).toFixed(2)}ms`);

    return field || null;
  } catch (error) {
    const end = performance.now();
    log.error(`❌ Error finding custom field '${fieldName}': ${error}`);
    log.error(`⏱️ Failed after ${(end - start).toFixed(2)}ms`);
    return null;
  }
};

/**
 * Create or find a custom story points field
 * @param fieldName - The name for the story points field (defaults to "Story Points")
 * @returns Field ID that can be used in issue updates
 */
export const ensureStoryPointsField = async (
  fieldName: string = 'Story Points'
): Promise<string> => {
  const start = performance.now();

  try {
    log.info(`🔧 Ensuring story points field exists: ${fieldName}`);

    // First, try to find an existing field
    const existingField = await findCustomFieldByName(fieldName);
    if (existingField) {
      log.info(
        `✅ Using existing story points field: ${existingField.name} (ID: ${existingField.id})`
      );
      return existingField.id;
    }

    // Try to find common story points field names
    const commonStoryPointNames = [
      'Story Points',
      'Story points',
      'StoryPoints',
      'Story points',
      'Points',
      'SP',
      'Story Point',
      'Story point',
    ];

    for (const commonName of commonStoryPointNames) {
      if (commonName.toLowerCase() === fieldName.toLowerCase()) continue; // Already checked

      const commonField = await findCustomFieldByName(commonName);
      if (commonField) {
        log.info(
          `✅ Found existing story points field with different name: ${commonField.name} (ID: ${commonField.id})`
        );
        return commonField.id;
      }
    }

    // Try to find any custom field that might be used for story points
    log.info(`🔍 Searching for any existing story points related fields...`);
    const allFields = await getFields();

    // First, look for the specific GreenHopper story points field
    const greenHopperStoryPoints = allFields.find(
      f => f.custom && f.schema?.custom === 'com.pyxis.greenhopper.jira:jsw-story-points'
    );

    if (greenHopperStoryPoints) {
      log.info(
        `✅ Found GreenHopper story points field: ${greenHopperStoryPoints.name} (ID: ${greenHopperStoryPoints.id})`
      );
      return greenHopperStoryPoints.id;
    }

    // Then look for other story points related fields
    const storyPointFields = allFields.filter(
      f =>
        f.custom &&
        ((f.name.toLowerCase().includes('story') && f.name.toLowerCase().includes('point')) ||
          f.name.toLowerCase().includes('sp') ||
          (f.name.toLowerCase().includes('points') && f.name.toLowerCase().includes('story')))
    );

    if (storyPointFields.length > 0) {
      const bestMatch = storyPointFields[0];
      if (bestMatch) {
        log.info(`✅ Found existing story points field: ${bestMatch.name} (ID: ${bestMatch.id})`);
        return bestMatch.id;
      }
    }

    // If no existing field found, try to create a new one
    log.info(`🔧 No existing story points field found, attempting to create: ${fieldName}`);
    try {
      const newField = await createCustomField({
        name: fieldName,
        description: 'Story points for agile estimation',
        type: 'com.atlassian.jira.plugin.system.customfieldtypes:number',
      });

      log.info(`✅ Created new story points field: ${newField.name} (ID: ${newField.id})`);
      return newField.id;
    } catch (createError) {
      log.warn(`⚠️ Could not create custom story points field: ${createError}`);
      log.info(`💡 The tool will continue with labels and comments only`);

      // Return a fallback field ID that might work
      // Try to find the standard story points field ID
      const standardStoryPointsField = allFields.find(
        f =>
          f.id === 'customfield_10016' || // Common story points field ID
          (f.name.toLowerCase().includes('story') && f.name.toLowerCase().includes('point'))
      );

      if (standardStoryPointsField) {
        log.info(
          `✅ Using standard story points field: ${standardStoryPointsField.name} (ID: ${standardStoryPointsField.id})`
        );
        return standardStoryPointsField.id;
      }

      // If all else fails, throw the original error
      throw createError;
    }
  } catch (error) {
    const end = performance.now();
    log.error(`❌ Error ensuring story points field: ${error}`);
    log.error(`⏱️ Failed after ${(end - start).toFixed(2)}ms`);
    throw error;
  }
};

/**
 * Get the field ID for story points in a project
 * This will create the field if it doesn't exist
 * @param projectKey - The project key
 * @param fieldName - The name for the story points field
 * @returns Field ID that can be used in issue updates
 */
export const getStoryPointsFieldId = async (
  projectKey: string,
  fieldName: string = 'Story Points'
): Promise<string> => {
  const start = performance.now();

  try {
    log.info(`🔧 Getting story points field ID for project: ${projectKey}`);

    const fieldId = await ensureStoryPointsField(fieldName);

    const end = performance.now();
    log.info(`⏱️ getStoryPointsFieldId executed in ${(end - start).toFixed(2)}ms`);
    log.info(`✅ Story points field ID: ${fieldId}`);

    return fieldId;
  } catch (error) {
    const end = performance.now();
    log.error(`❌ Error getting story points field ID: ${error}`);
    log.error(`⏱️ Failed after ${(end - start).toFixed(2)}ms`);
    throw error;
  }
};
