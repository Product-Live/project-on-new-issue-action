import * as core from '@actions/core';
import * as github from '@actions/github';
import { getInput } from './input';

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

        /**
         * Create a comment on the PR with the information we compiled from the
         * list of changed files.
         */
        await octokit.rest.issues.createComment({
            owner: inputs.owner,
            repo: inputs.repo,
            issue_number: inputs.issue_number,
            body: `
        test from ts action
      `
        });

    } catch (error) {
        core.setFailed(error.message);
    }
}

// Call the main function to run the action
main();
