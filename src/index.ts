import * as core from '@actions/core';
import * as github from '@actions/github';
import { getInput } from './input';
import { IssueUtils } from './Issue.utils';
import { getIssue, getProject } from './github';

/**
 * https://www.freecodecamp.org/news/build-your-first-javascript-github-action/
 */

const main = async () => {
    try {
        const inputs = getInput();
        console.log(inputs);

        const octokit = github.getOctokit(inputs.token);
        const project = await getProject(octokit, inputs.owner);
        const issue = await getIssue(octokit, inputs.owner, inputs.repo, inputs.issue_number);
        const issueUtils = new IssueUtils(octokit, project.id, issue);
        await issueUtils.addIssueToProjectAndFillFields();
    } catch (error) {
        core.setFailed(error.message);
    }
};

// Call the main function to run the action
main();
