import * as core from '@actions/core';
require('dotenv').config();

interface IInput {
    owner: string;
    repo: string;
    issue_number: number;
    token: string;
}

export function getInput(): IInput {
    if (process.env.NODE_ENV === 'dev') {
        return {
            owner: process.env.owner,
            repo: process.env.repo,
            issue_number: Number(process.env.issue),
            token: process.env.GITHUB_AUTH_TOKEN
        };
    }
    /**
     * We need to fetch all the inputs that were provided to our action
     * and store them in variables for us to use.
     **/
    return {
        owner: core.getInput('owner', { required: true }),
        repo: core.getInput('repo', { required: true }),
        issue_number: Number(core.getInput('issue_number', { required: true })),
        token: core.getInput('token', { required: true })
    };
}
