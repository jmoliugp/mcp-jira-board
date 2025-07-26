// Ref: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-field-configurations/

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

const log = new Logger('jira/field-configuration');

export interface FieldConfiguration {
  id: number;
  name: string;
  description: string;
  isDefault: boolean;
}

export interface FieldConfigurationScheme {
  id: number;
  name: string;
  description: string;
  defaultFieldConfiguration: {
    id: number;
    name: string;
  };
  fieldConfigurations: Array<{
    id: number;
    name: string;
    fields: Array<{
      id: string;
      name: string;
      required: boolean;
      renderer: string;
    }>;
  }>;
}

/**
 * Get field configuration schemes for a project
 * @param projectKey - The project key
 * @returns Field configuration schemes
 */
export const getProjectFieldConfigurationSchemes = async (
  projectKey: string
): Promise<FieldConfigurationScheme[]> => {
  const start = performance.now();

  try {
    const { data } = await axiosClient.get<FieldConfigurationScheme[]>(
      format(jiraApiEndpoint.project.getProjectFieldConfigurationSchemes, projectKey)
    );

    const end = performance.now();
    log.info(`⏱️ getProjectFieldConfigurationSchemes executed in ${(end - start).toFixed(2)}ms`);

    return data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const context = {
      status,
      data,
      projectKey,
      endpoint: format(jiraApiEndpoint.project.getProjectFieldConfigurationSchemes, projectKey),
    };

    if (status === 400)
      throw new UserInputError('Invalid input for getProjectFieldConfigurationSchemes.', context);
    if (status === 401)
      throw new AuthenticationError(
        'Authentication failed for getProjectFieldConfigurationSchemes.',
        context
      );
    if (status === 403)
      throw new ForbiddenError(
        'Access forbidden for getProjectFieldConfigurationSchemes.',
        context
      );
    if (status === 404) throw new NotFoundError('Project not found.', context);
    if (status && status >= 500)
      throw new InternalServerError(
        'Internal server error in getProjectFieldConfigurationSchemes.',
        context
      );
    throw new InternalServerError(
      'Unexpected error in getProjectFieldConfigurationSchemes.',
      context
    );
  }
};

/**
 * Check if a field is enabled in a project's field configuration
 * @param projectKey - The project key
 * @param fieldId - The field ID to check (e.g., 'timeoriginalestimate')
 * @returns True if the field is enabled, false otherwise
 */
export const isFieldEnabledInProject = async (
  projectKey: string,
  fieldId: string
): Promise<boolean> => {
  const start = performance.now();

  try {
    log.info(`🔍 Checking if field '${fieldId}' is enabled in project ${projectKey}`);

    const schemes = await getProjectFieldConfigurationSchemes(projectKey);

    if (schemes.length === 0) {
      log.warn(`⚠️ No field configuration schemes found for project ${projectKey}`);
      return false;
    }

    // Check all schemes for the field
    for (const scheme of schemes) {
      for (const fieldConfig of scheme.fieldConfigurations) {
        const field = fieldConfig.fields.find(f => f.id === fieldId);
        if (field) {
          log.info(`✅ Field '${fieldId}' found in configuration '${fieldConfig.name}'`);
          return true;
        }
      }
    }

    log.warn(
      `⚠️ Field '${fieldId}' not found in any field configuration for project ${projectKey}`
    );
    return false;
  } catch (error) {
    const end = performance.now();
    log.error(`❌ Error checking field '${fieldId}' in project ${projectKey}: ${error}`);
    log.error(`⏱️ Failed after ${(end - start).toFixed(2)}ms`);

    // If we can't check the configuration, assume the field is not enabled
    return false;
  }
};

/**
 * Attempt to enable a field in a project by updating field configuration
 * Note: This requires admin permissions and may not work in all Jira instances
 * @param projectKey - The project key
 * @param fieldId - The field ID to enable (e.g., 'timeoriginalestimate')
 * @returns True if successful, false otherwise
 */
export const attemptToEnableFieldInProject = async (
  projectKey: string,
  fieldId: string
): Promise<boolean> => {
  const start = performance.now();

  try {
    log.info(`🔧 Attempting to enable field '${fieldId}' in project ${projectKey}`);

    // First check if the field is already enabled
    const isEnabled = await isFieldEnabledInProject(projectKey, fieldId);
    if (isEnabled) {
      log.info(`✅ Field '${fieldId}' is already enabled in project ${projectKey}`);
      return true;
    }

    // Get the current field configuration schemes
    const schemes = await getProjectFieldConfigurationSchemes(projectKey);

    if (schemes.length === 0) {
      log.warn(`⚠️ No field configuration schemes found for project ${projectKey}`);
      log.warn(`⚠️ Cannot enable field '${fieldId}' - no configuration schemes available`);
      return false;
    }

    // Try to update the default field configuration
    // Note: This is a simplified approach and may not work in all cases
    log.warn(`⚠️ Field configuration update not implemented yet`);
    log.warn(`⚠️ Field '${fieldId}' cannot be automatically enabled in project ${projectKey}`);
    log.warn(`⚠️ Please enable the field manually in Jira project settings`);

    return false;
  } catch (error) {
    const end = performance.now();
    log.error(
      `❌ Error attempting to enable field '${fieldId}' in project ${projectKey}: ${error}`
    );
    log.error(`⏱️ Failed after ${(end - start).toFixed(2)}ms`);
    return false;
  }
};

/**
 * Attempt to configure story points field in a project
 * This will try to add the story points field to the project's field configuration
 * @param projectKey - The project key
 * @returns True if successful, false otherwise
 */
export const configureStoryPointsField = async (projectKey: string): Promise<boolean> => {
  const start = performance.now();

  try {
    log.info(`🔧 Attempting to configure story points field in project ${projectKey}`);

    // First, let's try to get the project's field configuration
    try {
      const { data } = await axiosClient.get(
        format(jiraApiEndpoint.project.getProjectFieldConfiguration, projectKey)
      );

      log.info(`📊 Found field configuration for project ${projectKey}`);
      log.info(`📋 Current field configuration: ${JSON.stringify(data, null, 2)}`);

      // Try to add story points field to the configuration
      // This is a simplified approach - in a real implementation, we'd need to
      // update the field configuration scheme properly

      log.info(`🔧 Attempting to add story points field to project configuration...`);

      // For now, we'll log what we found and suggest manual configuration
      log.warn(
        `⚠️ Automatic field configuration requires admin permissions and specific API calls`
      );
      log.warn(`⚠️ Please configure story points field manually in Jira admin settings`);
      log.info(`💡 The estimation tool will continue to work with labels and comments`);

      return false;
    } catch (configError) {
      log.warn(
        `⚠️ Could not retrieve field configuration for project ${projectKey}: ${configError}`
      );
      log.info(`💡 This is normal if you don't have admin permissions`);
      return false;
    }
  } catch (error) {
    const end = performance.now();
    log.error(`❌ Error configuring story points field in project ${projectKey}: ${error}`);
    log.error(`⏱️ Failed after ${(end - start).toFixed(2)}ms`);
    return false;
  }
};
