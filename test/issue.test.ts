import * as github from '@actions/github';
import { IssueType } from '../src/constants';
import { IssueUtils } from '../src/Issue.utils';
import { getInput } from '../src/input';
import { getIssue, getProject } from '../src/github';

describe(`Extract data from raw issue`, () => {
    const issue1 = {
        id: 'I_kwDOE0qG186AzIvK',
        number: 4828,
        body: "# 🗺️ Contexte\r\n\r\n- Origine : Service\r\n- Client(s) :\r\n- **Criticité** : Bloquant\r\n- **Portée**  : Très haut\r\n- **Impact**  : Très haut\r\n- **Confiance** : Très haut\r\n- **Ticket parent** :\r\n- **Ticket lié** : \r\n- **Ticket JIRA** : \r\n- **Description** :\r\n\r\n# 🤕 Besoin - Comportement constaté\r\n\r\n> En tant que Persona\r\nLorsque je UseCase\r\nCe que je voudrai c'est Besoin\r\nParce que Raison/Emotion\r\nMais il s'avère que Contrainte\r\nEt je dois Contournement\r\n\r\n# 🏗️ Comment reproduire\r\n\r\nPartir de cette table: [demo_products_table.zip](h ttps://github.com/Product-Live/product-improvements/files/14446402/demo_products_table.zip)\r\n\r\n- Environment : \r\n- Account : \r\n- Table : \r\n- User : \r\n- Job : \r\n- Job instance id : \r\n- Date et heure : \r\n\r\n1. Aller sur ...\r\n2. Faire ...\r\n3. Constater ...\r\n\r\n# 📜 Use case - Comportement attendu\r\n\r\n> En tant que Persona je peux Solution afin de Besoin\r\n\r\n--- \r\n\r\n# 🥅 Périmètre\r\n\r\n...\r\n\r\n# 📚 Documentation\r\n\r\n- [ ] ...\r\n\r\n# 🛠️ Tâches\r\n\r\n```[tasklist]\r\n### T asks\r\n- [ ] 🛠️ \r\n```\r\n\r\n# ✔️ Critères d'acceptation\r\n\r\n- Acc ount :\r\n- Table :\r\n- Items :\r\n\r\n- [ ] **Si** je suis ...\r\nEt que ...\r\n**Quand** je fais ...\r\nEt que ...\r\n**Alors** j'ai ...\r\nEt ...\r\n",
        title: '🐞 Fnac - TEST ISSUE DO NOT DELETE',
        labels: [{ name: 'Test account stage', id: 'LA_kwDOE0qG188AAAABixUvBg' }],
        trackedInIssues: [],
        projectItems: [
            {
                id: 'PVTI_lADOAHG1nM0je84DRZi0',
                project: { id: 'PVT_kwDOAHG1nM0jew' },
                fieldValues: {
                    nodes: [
                        {},
                        {
                            field: { dataType: 'REPOSITORY', id: 'PVTF_lADOAHG1nM0je84AAQlW', name: 'Repository' },
                            repository: {
                                id: 'MDEwOlJlcG9zaXRvcnkzMjM2NTEyODc=',
                                url: 'https://github.com/Product-Live/product-improvements'
                            }
                        },
                        {
                            field: { dataType: 'LABELS', id: 'PVTF_lADOAHG1nM0je84AAQlV', name: 'Labels' },
                            labels: { nodes: [{ id: 'LA_kwDOE0qG188AAAABixUvBg', name: 'Test account stage' }] }
                        },
                        {
                            field: { dataType: 'TITLE', id: 'PVTF_lADOAHG1nM0je84AAQlS', name: 'Title' },
                            text: '🐞 Fnac - TEST ISSUE DO NOT DELETE',
                            id: 'PVTFTV_lQDOAHG1nM0je84DRZi0zglLaJY',
                            updatedAt: '2024-02-29T10:09:37Z',
                            creator: { url: 'https://github.com/apps/github-project-automation' }
                        },
                        {
                            field: { dataType: 'SINGLE_SELECT', id: 'PVTSSF_lADOAHG1nM0je84AAQlU', name: 'Status' },
                            name: 'To Study',
                            id: 'PVTFSV_lQDOAHG1nM0je84DRZi0zglLaKA'
                        },
                        {
                            field: { dataType: 'SINGLE_SELECT', id: 'PVTSSF_lADOAHG1nM0je84AAQla', name: 'Type' },
                            name: '🐞 Bug',
                            id: 'PVTFSV_lQDOAHG1nM0je84DRZi0zglLbGw'
                        },
                        {
                            field: { dataType: 'SINGLE_SELECT', id: 'PVTSSF_lADOAHG1nM0je84AAZxC', name: 'Origin' },
                            name: 'Service',
                            id: 'PVTFSV_lQDOAHG1nM0je84DRZi0zglLbHQ'
                        },
                        {
                            field: { dataType: 'TEXT', id: 'PVTF_lADOAHG1nM0je84ABzSp', name: 'Id' },
                            text: '4828',
                            id: 'PVTFTV_lQDOAHG1nM0je84DRZi0zglM8-o',
                            updatedAt: '2024-02-29T14:37:52Z',
                            creator: { url: 'https://github.com/clecho' }
                        },
                        { field: { dataType: 'DATE', id: 'PVTF_lADOAHG1nM0je84AjwAv', name: 'Creation date' } },
                        {
                            field: {
                                dataType: 'SINGLE_SELECT',
                                id: 'PVTSSF_lADOAHG1nM0je84AASDH',
                                name: 'Criticality'
                            },
                            name: 'Blocker - 8',
                            id: 'PVTFSV_lQDOAHG1nM0je84DRZi0zglNKAA'
                        },
                        {
                            field: { dataType: 'SINGLE_SELECT', id: 'PVTSSF_lADOAHG1nM0je84AASPr', name: 'Reach' },
                            name: 'Very High - 5',
                            id: 'PVTFSV_lQDOAHG1nM0je84DRZi0zglNNBg'
                        },
                        {
                            field: { dataType: 'SINGLE_SELECT', id: 'PVTSSF_lADOAHG1nM0je84AASPs', name: 'Impact' },
                            name: 'Very High - 5',
                            id: 'PVTFSV_lQDOAHG1nM0je84DRZi0zglNSRA'
                        }
                    ]
                }
            }
        ]
    };

    it(`Guess issue type`, async () => {
        // Octokit mock
        const octokit = github.getOctokit('token');
        const issue = new IssueUtils(octokit, 'projectId', issue1);
        issue.guessIssueType();
        expect(issue.type).toBe(IssueType.BUG);
    });

    it(`Guess issue criticality`, async () => {
        // Octokit mock
        const octokit = github.getOctokit('token');
        const issue = new IssueUtils(octokit, 'projectId', issue1);
        issue.guessCriticalityField();
        expect(issue.criticality).toBe('Blocker');
    });

    it(`Guess issue reach`, async () => {
        // Octokit mock
        const octokit = github.getOctokit('token');
        const issue = new IssueUtils(octokit, 'projectId', issue1);
        issue.guessReachField();
        expect(issue.reach).toBe('Very High');
    });

    it(`Guess issue impact`, async () => {
        // Octokit mock
        const octokit = github.getOctokit('token');
        const issue = new IssueUtils(octokit, 'projectId', issue1);
        issue.guessImpactField();
        expect(issue.impact).toBe('Very High');
    });

    it(`Guess issue origin`, async () => {
        // Octokit mock
        const octokit = github.getOctokit('token');
        const issue = new IssueUtils(octokit, 'projectId', issue1);
        issue.guessOriginType();
        expect(issue.origin).toBe('Service');
    });

    it(`test`, async () => {
        const inputs = getInput();
        const octokit = github.getOctokit(inputs.token);
        const project = await getProject(octokit, inputs.owner);
        const issue = await getIssue(octokit, inputs.owner, inputs.repo, inputs.issue_number);
        console.log(JSON.stringify(issue));
        const issueUtils = new IssueUtils(octokit, project.id, issue);
        await issueUtils.createTestAccount(octokit, inputs.owner, inputs.repo);
        // expect(issueUtils.type).toBe(IssueCriticality.MAJOR);
        return true;
    }, 100000);
});
