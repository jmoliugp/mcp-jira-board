#!/usr/bin/env node

/**
 * Test script to demonstrate issue creation functionality
 *
 * This script shows how to:
 * 1. Get available issue types
 * 2. Create a user story
 * 3. Create a bug
 * 4. Search for issues
 *
 * Usage: pnpm tsx scripts/test-issue-creation.ts
 */

import * as issueService from '../src/services/jira/issue.js';
import { Logger } from '../src/utils/log.js';

const log = new Logger('Test Issue Creation');

async function testIssueCreation() {
  try {
    log.info('🧪 Starting issue creation test...');

    // 1. Get available issue types
    log.info('📋 Getting available issue types...');
    const issueTypes = await issueService.getIssueTypes();
    log.info(`✅ Found ${issueTypes.values.length} issue types:`);
    issueTypes.values.forEach(type => {
      log.info(`   - ${type.name} (ID: ${type.id}): ${type.description}`);
    });

    // 2. Create a user story
    log.info('📝 Creating a user story...');
    const userStory = await issueService.createUserStory(
      'TEST', // Replace with your actual project key
      'Test User Story - User Authentication',
      'As a user, I want to be able to log in to the application so that I can access my account.',
      undefined, // No assignee
      3, // Story points
      ['authentication', 'frontend', 'test']
    );
    log.info(`✅ Created user story: ${userStory.key}`);

    // 3. Create a bug
    log.info('🐛 Creating a bug...');
    const bug = await issueService.createBug(
      'TEST', // Replace with your actual project key
      'Test Bug - Login Button Not Working',
      'The login button does not respond when clicked. This is a critical issue that prevents users from accessing the application.',
      undefined, // No assignee
      '10001', // High priority (you may need to adjust this ID)
      ['bug', 'critical', 'login', 'test']
    );
    log.info(`✅ Created bug: ${bug.key}`);

    // 4. Search for issues
    log.info('🔍 Searching for issues...');
    const searchResults = await issueService.searchIssues({
      jql: 'project = TEST ORDER BY created DESC',
      maxResults: 10,
      fields: ['summary', 'issuetype', 'status', 'created'],
    });
    log.info(`✅ Found ${searchResults.issues.length} issues:`);
    searchResults.issues.forEach(issue => {
      log.info(`   - ${issue.key}: ${issue.fields.summary} (${issue.fields.issuetype.name})`);
    });

    log.info('🎉 Issue creation test completed successfully!');
  } catch (error) {
    log.error(`❌ Error during issue creation test: ${error}`);
    if (error instanceof Error) {
      log.error(`❌ Error message: ${error.message}`);
      log.error(`❌ Error stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1] || ''}`) {
  testIssueCreation().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}
