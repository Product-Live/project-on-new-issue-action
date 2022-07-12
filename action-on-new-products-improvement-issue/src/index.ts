import * as core from '@actions/core';
import * as github from '@actions/github';
import type { GraphQlQueryResponseData } from "@octokit/graphql";
import { getInput } from './input';
import {Constants} from './constants';
import {GitHub} from '@actions/github/lib/utils';


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

async function getIssue(octokit: InstanceType<typeof GitHub>, owner: string, repo: string, issue_number: number): Promise<{ id: string }> {
    const res: GraphQlQueryResponseData = await octokit.graphql(` query {
        organization(login: "${owner}") {
            repository(name: "${repo}") {
                name
                id
                issue(number: ${issue_number}) {
                    id
                    title
                }
            }
        }
    }`);
    return res.organization.repository.issue;
}

type ProjectFieldValue = { date: string } | { iterationId: string } | { number: number } | { singleSelectOptionId: string } | { text: string };

async function setProjectFieldValue(octokit: InstanceType<typeof GitHub>, projectId: string, itemId: string, fieldId: string, value: ProjectFieldValue): Promise<void> {
    const mutation = `mutation {
        updateProjectV2ItemFieldValue(input: {
            projectId: "${projectId}",
            itemId: "${itemId}",
            fieldId: "${fieldId}",
            value: {${Object.keys(value)[0]}: ${JSON.stringify(value[Object.keys(value)[0]])}}
        }) {
            clientMutationId
        }
    }`;
    await octokit.graphql(mutation);
}

async function addIssueToProject(octokit: InstanceType<typeof GitHub>, projectId: string, issueId: string): Promise<void> {
    const res: GraphQlQueryResponseData = await octokit.graphql(`
        mutation {
            addProjectV2ItemById(input: {projectId: "${projectId}", contentId: "${issueId}"}) {
                item {
                    id
                    type
                    content {
                        ... on Issue {
                            id
                            number
                            createdAt
                        }
                    }
                }
            }
        }`);
    const projectItemId: string = res.addProjectV2ItemById.item.id;
    const issueNumber: number = res.addProjectV2ItemById.item.content.number;
    const issueCreatedAt: string = res.addProjectV2ItemById.item.content.createdAt;

    const projectFields: GraphQlQueryResponseData = await octokit.graphql(`query {
        node(id: "${projectId}") {
            ... on ProjectV2 {
                fields(first: 100) {
                    nodes {
                        ... on ProjectV2Field {
                            id
                            name
                        }
                        ... on ProjectV2IterationField {
                            id
                            name
                        }
                        ... on ProjectV2SingleSelectField {
                            id
                            name
                        }
                    }
                }
            }
        }
    }`);
    const fieldIssueNumber = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_ISSUE_NUMBER);
    if (fieldIssueNumber) {
        console.log('Setting issue number in project');
        await setProjectFieldValue(octokit, projectId, projectItemId, fieldIssueNumber.id, { text: issueNumber.toString() });
    }

    const fieldCreationDate = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_CREATION_DATE);
    if (fieldCreationDate) {
        console.log('Setting issue creation date in project');
        await setProjectFieldValue(octokit, projectId, projectItemId, fieldCreationDate.id, { date: issueCreatedAt });
    }
}


/**
 * https://www.freecodecamp.org/news/build-your-first-javascript-github-action/
 */

const main = async () => {
    try {
        const inputs = getInput();
        console.log(inputs);

        /**
         * Now we need to create an instance of Octokit which will use to call
         * GitHub's REST API endpoints.
         * We will pass the token as an argument to the constructor. This token
         * will be used to authenticate our requests.
         * You can find all the information about how to use Octokit here:
         * https://octokit.github.io/rest.js/v18
         **/
        const octokit = github.getOctokit(inputs.token);
        const project = await getProject(octokit, inputs.owner);
        console.log('project', project);
        const issue = await getIssue(octokit, inputs.owner, inputs.repo, inputs.issue_number);
        console.log('issue I_kwDOE0qG185NimFE', issue);
        await addIssueToProject(octokit, project.id, issue.id);

        /*const res = await octokit.graphql({
            query: `{
                __type(name:"Organization") {
                    fields {
                        name,
                        description
                    }
                }
            }`
        });*

         */



                /*organization(login: "${inputs.owner}") {
                  projectsV2(first: 20) {...}
                }*/
    } catch (error) {
        core.setFailed(error.message);
    }
}

// Call the main function to run the action
main();
