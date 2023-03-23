import * as github from '@actions/github';
import { IssueCriticality, IssueType } from "../src/constants";
import { IssueUtils } from "../src/Issue.utils";

describe(`Extract data from raw issue`, () => {

    const issue1 = {"id":"I_kwDOE0qG185hnQPR","body":"### 🐦 Launch Tweet\n\n> _..._\r\n\n\n### 📣 Pitch\n\n**For** ...**Who** ...**The `subject`** consists of ...**Which unlike** ...**The `subject`** will allow ...**And thus** will allow users to ...**And thus** will allow Product-Live** to ...\n\n### Criticality\n\nMajor\n\n### Reach\n\nLow\n\n### Impact\n\nMedium\n\n### Confidence\n\nHigh\n\n### 🎯 Goal\n\n> Our goal is to achieve results\r\nWe believe it will bring Impact to the Persona\r\nThis will be confirmed when the event takes place\r\n\n\n### 📊 Key results\n\n...\r\n\n\n### ❤️ Need\n\n> As a Persona\r\nWhen I UseCase\r\nWhat I would want Need\r\nBut it turns out that Constraint\r\nAnd I have to Workaround\r\n\n\n### 📜 Use cases\n\n> As a Persona I can Solution to Need\r\n\n\n### 🥅 Perimeter\n\n...\r\n\n\n### 📚 Documentation\n\n...\r\n\n\n### 💡Stories & 🐞 Bugs\n\n```[tasklist]\r\n### 💡 Stories & 🐞 Bugs\r\n- [ ] 💡\r\n```","title":"📚  Issue de test, ne pas supprimer","labels":[],"trackedInIssues":[]};

    it(`Guess issue type`, async () => {
        // Octokit mock
        const octokit = github.getOctokit('token');
        const issue = new IssueUtils(octokit, 'projectId', issue1);
        issue.guessIssueType();
        expect(issue.type).toBe(IssueType.EPIC);
    })

    it(`Guess issue type`, async () => {
        // Octokit mock
        const octokit = github.getOctokit('token');
        const issue = new IssueUtils(octokit, 'projectId', issue1);
        const additionalInfos = issue.getAdditionalInfos();
        expect(additionalInfos.criticity).toBe(IssueCriticality.MAJOR);
    })

})