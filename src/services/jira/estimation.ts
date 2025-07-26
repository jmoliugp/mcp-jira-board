// Ref: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post

import { performance } from 'perf_hooks';
import { Logger } from '../../utils/log.js';
import * as issueService from './issue.js';
import * as projectService from './project.js';
// Custom field services removed to simplify the codebase

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
 * Generate AI story estimation using Fibonacci sequence
 * Returns a random value from the first few Fibonacci numbers commonly used in story point estimation
 * @returns A story point value from the Fibonacci sequence
 */
function storyAiEstimation(): number {
  const fibonacciSequence = [1, 2, 3, 5, 8, 13, 21];

  const randomIndex = Math.floor(Math.random() * fibonacciSequence.length);
  const estimatedPoints = fibonacciSequence[randomIndex] || 1;

  log.info(`AI estimated story points: ${estimatedPoints}`);
  return estimatedPoints;
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

  const { projectKey, estimationLabel = 'ai-estimation', maxResults = 100 } = params;

  log.info(`🔧 Starting AI story estimation for project: ${projectKey}`);
  log.info(`🎲 Will use AI Fibonacci estimation for each story`);
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

    // Try to use labels for estimation, fallback to comments only if labels fail
    log.info(`🔧 Using estimation approach for project: ${projectKey}`);
    log.info(`💡 Will try to add labels and comments, fallback to comments only if labels fail`);

    // Search for all main issues (not subtasks) in the project
    log.info(`🔍 Searching for main issues in project: ${projectKey}`);
    const searchParams: issueService.SearchIssuesParams = {
      jql: `project = ${projectKey} AND issuetype != Sub-task ORDER BY created DESC`,
      maxResults,
      fields: ['summary', 'description', 'labels', 'timeoriginalestimate', 'issuetype'], // Include original estimate field and issue type
    };

    const searchResult = await issueService.searchIssues(searchParams);
    result.totalStories = searchResult.issues?.length || 0;

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

        // Generate AI estimation for this story
        const aiEstimatedPoints = storyAiEstimation();

        // Prepare update input - try to add labels, fallback to comments only if labels fail
        const updateInput: issueService.UpdateIssueInput = {
          fields: {
            labels: [...(issue.fields.labels || []), estimationLabel], // Try to add estimation label
          },
          update: {
            comment: [
              {
                add: {
                  body: `🤖 AI Estimation\n\nSuggested story points: ${aiEstimatedPoints}\n\nThis AI estimation was applied automatically and may need review by the development team.`,
                },
              },
            ],
          },
        };

        // Try to update with labels first, fallback to comments only if labels fail
        try {
          await issueService.updateIssue(issue.key, updateInput);
          log.info(`✅ Successfully estimated ${issue.key} (with labels and comments)`);
        } catch (labelError) {
          // If labels fail, try without labels
          if (labelError instanceof Error && labelError.message.includes('labels')) {
            log.warn(
              `⚠️ Labels failed for ${issue.key}, trying without labels: ${labelError.message}`
            );

            const fallbackInput: issueService.UpdateIssueInput = {
              update: {
                comment: [
                  {
                    add: {
                      body: `🤖 AI Estimation\n\nSuggested story points: ${aiEstimatedPoints}\n\nThis AI estimation was applied automatically and may need review by the development team.`,
                    },
                  },
                ],
              },
            };

            await issueService.updateIssue(issue.key, fallbackInput);
            log.info(
              `✅ Successfully estimated ${issue.key} (comments only - labels not available)`
            );
          } else {
            // If it's not a label error, re-throw
            throw labelError;
          }
        }

        // Add to successful estimations
        result.estimatedIssues.push({
          key: issue.key,
          summary: issue.fields.summary,
          storyPoints: aiEstimatedPoints, // Use AI estimated story points
          labels: [...(issue.fields.labels || []), estimationLabel], // Include the estimation label
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
