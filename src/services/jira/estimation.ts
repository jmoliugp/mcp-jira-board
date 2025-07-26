// Ref: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post

import { performance } from 'perf_hooks';
import { Logger } from '../../utils/log.js';
import * as issueService from './issue.js';
import * as projectService from './project.js';

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

    // Search for all stories in the project
    log.info(`🔍 Searching for stories in project: ${projectKey}`);
    const searchParams: issueService.SearchIssuesParams = {
      jql: `project = ${projectKey} AND issuetype = Story ORDER BY created DESC`,
      maxResults,
      fields: ['summary', 'description', 'labels', 'customfield_10016'], // Include story points field
    };

    const searchResult = await issueService.searchIssues(searchParams);
    result.totalStories = searchResult.issues.length;

    log.info(`📊 Found ${result.totalStories} stories in project ${projectKey}`);

    if (result.totalStories === 0) {
      log.info(`ℹ️ No stories found in project ${projectKey}`);
      return result;
    }

    // Filter stories that don't have story points and don't already have the estimation label
    const unestimatedStories = searchResult.issues.filter(issue => {
      const storyPoints = issue.fields['customfield_10016'];
      const labels = issue.fields.labels || [];
      const hasEstimationLabel = labels.includes(estimationLabel);

      return !storyPoints && !hasEstimationLabel;
    });

    result.unestimatedStories = unestimatedStories.length;
    log.info(`📊 Found ${result.unestimatedStories} unestimated stories`);

    if (result.unestimatedStories === 0) {
      log.info(`ℹ️ All stories are already estimated or have estimation label`);
      return result;
    }

    // Estimate each unestimated story
    log.info(`🚀 Starting estimation process for ${result.unestimatedStories} stories...`);

    for (const story of unestimatedStories) {
      try {
        log.info(`📝 Estimating story: ${story.key} - "${story.fields.summary}"`);

        // Prepare update input
        const updateInput: issueService.UpdateIssueInput = {
          fields: {
            customfield_10016: defaultStoryPoints, // Set story points
            labels: [...(story.fields.labels || []), estimationLabel], // Add estimation label
          },
          update: {
            comment: [
              {
                add: {
                  body: `🤖 **AI Estimation Applied**\n\nStory points set to **${defaultStoryPoints}** by automatic estimation system.\n\n*This estimation was applied automatically and may need review by the development team.*`,
                },
              },
            ],
          },
        };

        // Update the issue
        await issueService.updateIssue(story.key, updateInput);

        // Add to successful estimations
        result.estimatedIssues.push({
          key: story.key,
          summary: story.fields.summary,
          storyPoints: defaultStoryPoints,
          labels: [...(story.fields.labels || []), estimationLabel],
        });

        result.estimatedStories++;
        log.info(`✅ Successfully estimated ${story.key} with ${defaultStoryPoints} story points`);
      } catch (error) {
        log.error(`❌ Failed to estimate story ${story.key}: ${error}`);

        result.failedIssues.push({
          key: story.key,
          summary: story.fields.summary,
          error: error instanceof Error ? error.message : String(error),
        });

        result.failedEstimations++;
      }
    }

    const end = performance.now();
    log.info(`⏱️ Story estimation completed in ${(end - start).toFixed(2)}ms`);
    log.info(`📊 Estimation Summary:`);
    log.info(`   - Total stories: ${result.totalStories}`);
    log.info(`   - Unestimated stories: ${result.unestimatedStories}`);
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
    // Search for all stories in the project
    const searchParams: issueService.SearchIssuesParams = {
      jql: `project = ${projectKey} AND issuetype = Story`,
      maxResults: 1000, // Get all stories for accurate stats
      fields: ['summary', 'labels', 'customfield_10016'],
    };

    const searchResult = await issueService.searchIssues(searchParams);
    const stories = searchResult.issues;

    let estimatedStories = 0;
    let totalStoryPoints = 0;
    let aiEstimatedStories = 0;

    for (const story of stories) {
      const storyPoints = story.fields['customfield_10016'];
      const labels = story.fields.labels || [];

      if (storyPoints) {
        estimatedStories++;
        totalStoryPoints += storyPoints;

        if (labels.includes('ai-estimation')) {
          aiEstimatedStories++;
        }
      }
    }

    const unestimatedStories = stories.length - estimatedStories;
    const averageStoryPoints = estimatedStories > 0 ? totalStoryPoints / estimatedStories : 0;

    const stats = {
      projectKey,
      totalStories: stories.length,
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
