import * as core from '@actions/core';
import * as github from '@actions/github';
import type { GraphQlQueryResponseData } from "@octokit/graphql";
import { getInput } from './input';
import {Constants} from './constants';
import {GitHub} from '@actions/github/lib/utils';
import {GithubIssue} from './definitions';
import {IssueUtils} from './Issue.utils';


async function getProject(octokit: InstanceType<typeof GitHub>, owner: string): Promise<{ id: string }> {
    const projects: GraphQlQueryResponseData = await octokit.graphql({
        query: `{
                organization(login: "${owner}") {
                    name
                    projectsV2(first: 20) {
                        nodes {
                            title
                            id
                        }
                    }
                }
            }`
    });
    const project = projects.organization.projectsV2.nodes.find((p) => p.title === Constants.PROJECT_TITLE);
    if (!project) {
        throw new Error(`Project ${Constants.PROJECT_TITLE} not found`);
    }
    return project;
}

async function getIssue(octokit: InstanceType<typeof GitHub>, owner: string, repo: string, issue_number: number): Promise<GithubIssue> {
    const res: GraphQlQueryResponseData = await octokit.graphql(` query {
        organization(login: "${owner}") {
            repository(name: "${repo}") {
                name
                id
                issue(number: ${issue_number}) {
                    id
                    title
                    body
                    labels(first: 20) {
                        nodes {
                            name
                            id
                        }
                    }
                }
            }
        }
    }`);
    return {
        id: res.organization.repository.issue.id,
        body: res.organization.repository.issue.body,
        labels: res.organization.repository.issue.labels.nodes
    };
}


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
        await issueUtils.addIssueToProject();
    } catch (error) {
        core.setFailed(error.message);
    }
}

// Call the main function to run the action
main();
