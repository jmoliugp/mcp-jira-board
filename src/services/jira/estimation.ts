// Ref: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post

import { performance } from 'perf_hooks';
import { Logger } from '../../utils/log.js';
import * as issueService from './issue.js';
import * as projectService from './project.js';
import * as customFieldService from './custom-field.js';
import * as fieldConfigurationService from './field-configuration.js';

const log = new Logger('jira/estimation');

export interface EstimationResult {
  projectKey: string;
  totalStories: number;
  unestimatedStories: number;
  estimatedStories: number;
  failedEstimations: number;
  estimatedIssues: Array<{
    key: string;
    summary: string;
    storyPoints: number;
    labels: string[];
  }>;
  failedIssues: Array<{
    key: string;
    summary: string;
    error: string;
  }>;
}

export interface EstimateStoriesParams {
  projectKey: string;
  defaultStoryPoints?: number;
  estimationLabel?: string;
  maxResults?: number;
}

/**
 * Estimate all unestimated stories in a project with default story points
 * @param params - Parameters for story estimation
 * @returns Estimation results
 */
export const estimateStoriesInProject = async (
  params: EstimateStoriesParams
): Promise<EstimationResult> => {
  const start = performance.now();

  const {
    projectKey,
    defaultStoryPoints = 3, // Default to 3 story points
    estimationLabel = 'ai-estimation',
    maxResults = 100,
  } = params;

  log.info(`🔧 Starting story estimation for project: ${projectKey}`);
  log.info(`📊 Default story points: ${defaultStoryPoints}`);
  log.info(`🏷️ Estimation label: ${estimationLabel}`);

  const result: EstimationResult = {
    projectKey,
    totalStories: 0,
    unestimatedStories: 0,
    estimatedStories: 0,
    failedEstimations: 0,
    estimatedIssues: [],
    failedIssues: [],
  };

  try {
    // First, verify the project exists
    log.info(`🔍 Verifying project exists: ${projectKey}`);
    await projectService.getProject(projectKey);
    log.info(`✅ Project verified: ${projectKey}`);

    // Get or create a custom story points field
    log.info(`🔧 Setting up custom story points field for project: ${projectKey}`);
    let storyPointsFieldId: string | null = null;

    try {
      storyPointsFieldId = await customFieldService.getStoryPointsFieldId(
        projectKey,
        'AI Story Points'
      );
      log.info(`✅ Custom story points field ready: ${storyPointsFieldId}`);

      // Try to configure the story points field in the project
      log.info(`🔧 Attempting to configure story points field in project...`);
      const configured = await fieldConfigurationService.configureStoryPointsField(projectKey);

      if (configured) {
        log.info(`✅ Story points field successfully configured in project ${projectKey}`);
      } else {
        log.info(`ℹ️ Story points field configuration not available - will use fallback mode`);
      }
    } catch (error) {
      log.warn(`⚠️ Could not create custom story points field: ${error}`);
      log.info(`💡 The tool will continue with labels and comments only`);
      log.info(
        `💡 This is normal if you don't have admin permissions or if custom fields are disabled`
      );
      storyPointsFieldId = null;
    }

    // Search for all main issues (not subtasks) in the project
    log.info(`🔍 Searching for main issues in project: ${projectKey}`);
    const searchParams: issueService.SearchIssuesParams = {
      jql: `project = ${projectKey} AND issuetype != Sub-task ORDER BY created DESC`,
      maxResults,
      fields: ['summary', 'description', 'labels', 'timeoriginalestimate', 'issuetype'], // Include original estimate field and issue type
    };

    const searchResult = await issueService.searchIssues(searchParams);
    result.totalStories = searchResult.issues.length;

    log.info(`📊 Found ${result.totalStories} main issues in project ${projectKey}`);

    if (result.totalStories === 0) {
      log.info(`ℹ️ No main issues found in project ${projectKey}`);
      return result;
    }

    // Filter issues that don't have original estimate and don't already have the estimation label
    const unestimatedIssues = searchResult.issues.filter(issue => {
      const originalEstimate = issue.fields['timeoriginalestimate'];
      const labels = issue.fields.labels || [];
      const hasEstimationLabel = labels.includes(estimationLabel);

      return !originalEstimate && !hasEstimationLabel;
    });

    result.unestimatedStories = unestimatedIssues.length;
    log.info(`📊 Found ${result.unestimatedStories} unestimated issues`);

    if (result.unestimatedStories === 0) {
      log.info(`ℹ️ All issues are already estimated or have estimation label`);
      return result;
    }

    // Estimate each unestimated issue
    log.info(`🚀 Starting estimation process for ${result.unestimatedStories} issues...`);

    for (const issue of unestimatedIssues) {
      try {
        log.info(`📝 Estimating issue: ${issue.key} - "${issue.fields.summary}"`);

        // Prepare update input - start with just labels and comments
        const updateInput: issueService.UpdateIssueInput = {
          fields: {
            labels: [...(issue.fields.labels || []), estimationLabel], // Add estimation label
          },
          update: {
            comment: [
              {
                add: {
                  body: `🤖 **AI Estimation Applied**\n\nEstimated story points: **${defaultStoryPoints}**\n\n*This AI estimation was applied automatically and may need review by the development team.*`,
                },
              },
            ],
          },
        };

        // Try to update the issue with custom story points field
        let estimateSet = false;
        if (storyPointsFieldId) {
          try {
            const updateWithStoryPoints: issueService.UpdateIssueInput = {
              fields: {
                [storyPointsFieldId]: defaultStoryPoints, // Use custom field ID
                labels: [...(issue.fields.labels || []), estimationLabel],
              },
              update: {
                comment: [
                  {
                    add: {
                      body: `🤖 **AI Estimation Applied**\n\nStory points set to **${defaultStoryPoints}** by AI-powered automatic estimation system.\n\n*This AI estimation was applied automatically and may need review by the development team.*`,
                    },
                  },
                ],
              },
            };

            await issueService.updateIssue(issue.key, updateWithStoryPoints);
            estimateSet = true;
            log.info(
              `✅ Successfully estimated ${issue.key} with ${defaultStoryPoints} story points`
            );
          } catch (estimateError) {
            // If custom field is not available, try without it
            log.warn(
              `⚠️ Custom story points field not available for ${issue.key}, trying without estimate`
            );

            await issueService.updateIssue(issue.key, updateInput);
            log.info(`✅ Successfully estimated ${issue.key} (labels and comments only)`);
          }
        } else {
          // No custom field available, use labels and comments only
          await issueService.updateIssue(issue.key, updateInput);
          log.info(`✅ Successfully estimated ${issue.key} (labels and comments only)`);
        }

        // Add to successful estimations
        result.estimatedIssues.push({
          key: issue.key,
          summary: issue.fields.summary,
          storyPoints: estimateSet ? defaultStoryPoints : 0,
          labels: [...(issue.fields.labels || []), estimationLabel],
        });

        result.estimatedStories++;
      } catch (error) {
        log.error(`❌ Failed to estimate issue ${issue.key}: ${error}`);

        result.failedIssues.push({
          key: issue.key,
          summary: issue.fields.summary,
          error: error instanceof Error ? error.message : String(error),
        });

        result.failedEstimations++;
      }
    }

    const end = performance.now();
    log.info(`⏱️ Issue estimation completed in ${(end - start).toFixed(2)}ms`);
    log.info(`📊 Estimation Summary:`);
    log.info(`   - Total issues: ${result.totalStories}`);
    log.info(`   - Unestimated issues: ${result.unestimatedStories}`);
    log.info(`   - Successfully estimated: ${result.estimatedStories}`);
    log.info(`   - Failed estimations: ${result.failedEstimations}`);

    return result;
  } catch (error) {
    const end = performance.now();
    log.error(`❌ Error in estimateStoriesInProject: ${error}`);
    log.error(`⏱️ Failed after ${(end - start).toFixed(2)}ms`);
    throw error;
  }
};

/**
 * Get estimation statistics for a project
 * @param projectKey - The project key
 * @returns Estimation statistics
 */
export const getProjectEstimationStats = async (
  projectKey: string
): Promise<{
  projectKey: string;
  totalStories: number;
  estimatedStories: number;
  unestimatedStories: number;
  aiEstimatedStories: number;
  averageStoryPoints: number;
}> => {
  const start = performance.now();

  log.info(`📊 Getting estimation statistics for project: ${projectKey}`);

  try {
    // Search for all main issues (not subtasks) in the project
    const searchParams: issueService.SearchIssuesParams = {
      jql: `project = ${projectKey} AND issuetype != Sub-task`,
      maxResults: 1000, // Get all issues for accurate stats
      fields: ['summary', 'labels', 'timeoriginalestimate', 'issuetype'],
    };

    const searchResult = await issueService.searchIssues(searchParams);
    const issues = searchResult.issues;

    let estimatedStories = 0;
    let totalStoryPoints = 0;
    let aiEstimatedStories = 0;

    for (const issue of issues) {
      const originalEstimate = issue.fields['timeoriginalestimate'];
      const labels = issue.fields.labels || [];

      if (originalEstimate) {
        estimatedStories++;
        // Convert milliseconds to story points (1 hour = 1 story point)
        const storyPoints = Math.round(originalEstimate / 3600000);
        totalStoryPoints += storyPoints;

        if (labels.includes('ai-estimation')) {
          aiEstimatedStories++;
        }
      }
    }

    const unestimatedStories = issues.length - estimatedStories;
    const averageStoryPoints = estimatedStories > 0 ? totalStoryPoints / estimatedStories : 0;

    const stats = {
      projectKey,
      totalStories: issues.length,
      estimatedStories,
      unestimatedStories,
      aiEstimatedStories,
      averageStoryPoints: Math.round(averageStoryPoints * 100) / 100, // Round to 2 decimal places
    };

    const end = performance.now();
    log.info(`⏱️ Statistics retrieved in ${(end - start).toFixed(2)}ms`);
    log.info(`📊 Project ${projectKey} stats: ${JSON.stringify(stats)}`);

    return stats;
  } catch (error) {
    const end = performance.now();
    log.error(`❌ Error getting estimation stats: ${error}`);
    log.error(`⏱️ Failed after ${(end - start).toFixed(2)}ms`);
    throw error;
  }
};
