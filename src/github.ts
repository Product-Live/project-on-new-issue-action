import { GitHub } from '@actions/github/lib/utils';
import { GithubIssue } from './definitions';
import type { GraphQlQueryResponseData } from '@octokit/graphql';
import { Constants } from './constants';
import { log } from './log';

export async function getProject(octokit: InstanceType<typeof GitHub>, owner: string): Promise<{ id: string }> {
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

export async function createCommentOnIssue(
    octokit: InstanceType<typeof GitHub>,
    owner: string,
    repo: string,
    issue_number: number,
    body: string
): Promise<void> {
    const comment = await octokit.rest.issues.createComment({
        owner: owner,
        repo: repo,
        issue_number: issue_number,
        body: body
    });
    log(comment);
}

export async function getIssue(
    octokit: InstanceType<typeof GitHub>,
    owner: string,
    repo: string,
    issue_number: number
): Promise<GithubIssue> {
    const res: GraphQlQueryResponseData = await octokit.graphql(
        ` 
        query getIssue($repo: String!, $owner: String!, $issue_number: Int!) {
            organization(login: $owner) {
                repository(name: $repo) {
                    name
                    id
                    issue(number: $issue_number) {
                        id
                        number
                        title
                        body
                        trackedInIssues(first: 100) {
                            nodes {
                                id
                            }
                        }
                        labels(first: 20) {
                            nodes {
                                name
                                id
                            }
                        }
                        projectItems(first: 100) {
                            nodes {
                                id
                                project {
                                    id
                                }
                                fieldValues(first: 100) {
                                    nodes {
                                        ... on ProjectV2ItemFieldValueCommon {
                                            field {
                                                ... on ProjectV2Field {
                                                    dataType
                                                    id
                                                    name
                                                }
                                            }
                                        }
                                        ... on ProjectV2ItemFieldSingleSelectValue {
                                            field {
                                                ... on  ProjectV2SingleSelectField{
                                                    dataType
                                                    id
                                                    name
                                                }
                                            }
                                            name
                                            id
                                        }
                                        ... on ProjectV2ItemFieldLabelValue {
                                            field {
                                                ... on ProjectV2Field {
                                                    dataType
                                                    id
                                                    name
                                                }
                                            }
                                            labels(first: 20) {
                                                nodes {
                                                    id
                                                    name
                                                }
                                            }
                                        }
                                        ... on ProjectV2ItemFieldTextValue {
                                            field {
                                                ... on ProjectV2Field {
                                                    dataType
                                                    id
                                                    name
                                                }
                                            }
                                            text
                                            id
                                            updatedAt
                                            creator {
                                                url
                                            }
                                        }
                                        ... on ProjectV2ItemFieldMilestoneValue {
                                            field {
                                                ... on ProjectV2Field {
                                                    dataType
                                                    id
                                                    name
                                                }
                                            }
                                            milestone {
                                                id
                                            }
                                        }
                                        ... on ProjectV2ItemFieldRepositoryValue {
                                            field {
                                                ... on ProjectV2Field {
                                                    dataType
                                                    id
                                                    name
                                                }
                                            }
                                            repository {
                                                id
                                                url
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }


    `,
        {
            owner,
            repo,
            issue_number
        }
    );
    return {
        id: res.organization.repository.issue.id,
        number: res.organization.repository.issue.number,
        body: res.organization.repository.issue.body,
        title: res.organization.repository.issue.title,
        labels: res.organization.repository.issue.labels.nodes,
        trackedInIssues: res.organization.repository.issue.trackedInIssues.nodes,
        projectItems: res.organization.repository.issue.projectItems.nodes
    };
}
