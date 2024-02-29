import { GitHub } from '@actions/github/lib/utils';
import { GraphQlQueryResponseData } from '@octokit/graphql';
import { Constants, IssueCriticality, IssueOrigin, IssueType } from './constants';
import { GithubIssue, ProjectFieldValue } from './definitions';
import { log } from './log';
import { Env } from './kaonashiToken';
import { KaonashiClientSingleton } from './kaonashiClient';
import { PLAccountZone, PlAccount } from '@product-live/yuba-domain';
import { createCommentOnIssue } from './github';

export class IssueUtils {
    public type: IssueType;
    public origin: string;
    public criticality: string;
    public reach: string;
    public impact: string;
    public confidence: string;

    constructor(
        readonly octokit: InstanceType<typeof GitHub>,
        readonly projectId: string,
        readonly issue: GithubIssue
    ) {}

    private setType(type: IssueType): void {
        this.type = type;
    }

    private setOrigin(origin: string): void {
        this.origin = origin;
    }

    private setCriticality(criticality: string): void {
        this.criticality = criticality;
    }

    private setReach(reach: string): void {
        this.reach = reach;
    }

    private setImpact(impact: string): void {
        this.impact = impact;
    }

    private setConfidence(confidence: string): void {
        this.confidence = confidence;
    }

    private async setProjectFieldValue(
        itemId: string,
        fieldId: string,
        value: ProjectFieldValue,
        doNotReplaceExistingValue = true
    ): Promise<void> {
        if (doNotReplaceExistingValue && this.issueHasValue(itemId, fieldId, value[Object.keys(value)[0]])) {
            log(`Field ${fieldId} already has value ${value[Object.keys(value)[0]]}, skipping`);
        }
        const mutation = `mutation {
        updateProjectV2ItemFieldValue(input: {
            projectId: "${this.projectId}",
            itemId: "${itemId}",
            fieldId: "${fieldId}",
            value: {${Object.keys(value)[0]}: ${JSON.stringify(value[Object.keys(value)[0]])}}
        }) {
            clientMutationId
        }
    }`;
        await this.octokit.graphql(mutation);
    }

    async createTestAccount(octokit: InstanceType<typeof GitHub>, owner: string, repo: string): Promise<void> {
        const labels = this.issue.labels.map((l) => l.name);
        log(`Issue has labels: ${labels}`);
        if (labels.includes(Constants.LABEL_TEST_ACCOUNT_STAGE)) {
            log('Creating test account');
            const client = await KaonashiClientSingleton.getInstance(Env.STAGE);
            log(JSON.stringify(this.issue));
            const issueNumber: number = this.issue.number;

            //1. Create a test account
            let account: PlAccount;
            try {
                account = await client.account().createAndAddMember(
                    {
                        companyName: `I - ${issueNumber}`,
                        subDomain: `i-${issueNumber}-test`,
                        zone: PLAccountZone.EUROPE
                    } as PlAccount,
                    Constants.TEST_ACCOUNT_MAIN_USER_EMAIL
                );
                log(`Account created with success: ${account.id}`);
            } catch (e) {
                log(e);
            }
        } else {
            log(`Test account creation is not required`);
        }
    }

    async addIssueToProjectAndFillFields(): Promise<void> {
        // Add the issue to the project
        const res: GraphQlQueryResponseData = await this.octokit.graphql(`
        mutation {
            addProjectV2ItemById(input: {projectId: "${this.projectId}", contentId: "${this.issue.id}"}) {
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

        // Get fields from the target project
        const projectFields: GraphQlQueryResponseData = await this.octokit.graphql(`query {
            node(id: "${this.projectId}") {
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
                                options {
                                    name
                                    id
                                }
                            }
                        }
                    }
                }
            }
        }`);

        // Fill ID field
        const fieldIssueNumber = projectFields.node.fields.nodes.find(
            (n) => n.name === Constants.PROJECT_FIELD_ISSUE_NUMBER
        );
        if (fieldIssueNumber) {
            log('Setting issue number in project');
            await this.setProjectFieldValue(projectItemId, fieldIssueNumber.id, { text: issueNumber.toString() });
        }

        // Fill creation date field
        const fieldCreationDate = projectFields.node.fields.nodes.find(
            (n) => n.name === Constants.PROJECT_FIELD_CREATION_DATE
        );
        if (fieldCreationDate) {
            log('Setting issue creation date in project');
            await this.setProjectFieldValue(projectItemId, fieldCreationDate.id, { date: issueCreatedAt });
        }

        // Fill status field
        const statusField = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_STATUS);
        if (statusField) {
            log('Setting issue status in project');
            await this.setProjectFieldValue(
                projectItemId,
                statusField.id,
                {
                    singleSelectOptionId: statusField.options.find((opt) => opt.name === 'To Study').id
                },
                false
            );
        }

        // Fill origin field
        this.guessOriginType();
        const originField = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_ORIGIN);
        if (originField && this.origin) {
            try {
                await this.setProjectFieldValue(projectItemId, originField.id, {
                    singleSelectOptionId: originField.options.find((opt) => opt.name.indexOf(this.origin) >= 0).id
                });
            } catch (e) {
                log(`Error setting origin: ${e}`);
            }
        }

        // Fill criticality field
        this.guessCriticalityField();
        const criticityField = projectFields.node.fields.nodes.find(
            (n) => n.name === Constants.PROJECT_FIELD_CRITICALITY
        );
        if (criticityField && this.criticality) {
            try {
                await this.setProjectFieldValue(projectItemId, criticityField.id, {
                    singleSelectOptionId: criticityField.options.find((opt) => opt.name.indexOf(this.criticality) >= 0)
                        .id
                });
            } catch (e) {
                log(`Error setting criticality: ${e}`);
            }
        }

        // Fill reach field
        this.guessReachField();
        const reachField = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_REACH);
        if (reachField && this.reach) {
            try {
                await this.setProjectFieldValue(projectItemId, reachField.id, {
                    singleSelectOptionId: reachField.options.find((opt) => opt.name.indexOf(this.reach) >= 0).id
                });
            } catch (e) {
                log(`Error setting reach: ${e}`);
            }
        }

        // Fill impact field
        this.guessImpactField();
        const impactField = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_IMPACT);
        if (impactField && this.impact) {
            try {
                await this.setProjectFieldValue(projectItemId, impactField.id, {
                    singleSelectOptionId: impactField.options.find((opt) => opt.name.indexOf(this.impact) >= 0).id
                });
            } catch (e) {
                log(`Error setting impact: ${e}`);
            }
        }

        // Fill confidence field
        this.guessConfidenceField();
        const confidenceField = projectFields.node.fields.nodes.find(
            (n) => n.name === Constants.PROJECT_FIELD_CONFIDENCE
        );
        if (confidenceField && this.confidence) {
            try {
                await this.setProjectFieldValue(projectItemId, confidenceField.id, {
                    singleSelectOptionId: confidenceField.options.find((opt) => opt.name.indexOf(this.confidence) >= 0)
                        .id
                });
            } catch (e) {
                log(`Error setting confidence: ${e}`);
            }
        }
    }

    public issueHasValue(itemId: string, fieldId: string): boolean {
        log(`Checking if field ${fieldId} has value`);
        const fieldValuesForCurrentProject = this.issue.projectItems.find((i) => i.project.id === this.projectId);
        if (!fieldValuesForCurrentProject) {
            return false;
        }
        const fieldValue = fieldValuesForCurrentProject.fieldValues.nodes.find((f) => f?.field?.id === fieldId);
        if (!fieldValue) {
            return false;
        }
        return true;
    }

    public guessIssueType(): void {
        if (this.issue.title.indexOf('🐞') >= 0) {
            this.setType(IssueType.BUG);
        } else if (this.issue.title.indexOf('🛠️') >= 0) {
            this.setType(IssueType.TASK);
        } else if (this.issue.title.indexOf('🚩') >= 0) {
            this.setType(IssueType.TASK);
        } else if (this.issue.title.indexOf('💡') >= 0) {
            this.setType(IssueType.USER_STORY);
        } else if (this.issue.title.indexOf('📚') >= 0) {
            this.setType(IssueType.EPIC);
        } else if (this.issue.title.indexOf('Deployment') >= 0) {
            this.setType(IssueType.DEVOPS);
        } else {
            this.setType(IssueType.UNKNOWN);
        }
    }

    public guessOriginType(): void {
        const originMap = {
            Service: 'Service',
            Support: 'Support',
            Dév: 'Dev',
            DévOps: 'Devops',
            Produit: 'Produit',
            CS: 'Customer Success',
            QA: 'Minor'
        };
        // Split body into lines
        const lines = this.issue.body.split('\n');
        // Find the line containing the origin
        const line = lines.find((l) => l.indexOf('Origine') >= 0);
        // If the line is found, extract the criticality
        if (line) {
            let raw = line.split(':')[1].trim();
            log('found origin', raw);
            if (originMap[raw]) {
                log(`and it's mapped to ${originMap[raw]}`);
                this.setOrigin(originMap[raw]);
            } else {
                log(`but it's not mapped`);
            }
        } else {
            log('no origin found');
        }
    }

    public guessCriticalityField(): void {
        const criticityMap = {
            Bloquant: 'Blocker',
            Critique: 'Critical',
            Majeur: 'Major',
            Mineur: 'Minor'
        };
        // Split body into lines
        const lines = this.issue.body.split('\n');
        // Find the line containing the criticality
        const line = lines.find((l) => l.indexOf('**Criticité**') >= 0);
        // If the line is found, extract the criticality
        if (line) {
            let rawCriticality = line.split(':')[1].trim();
            log('found criticality', rawCriticality);
            if (criticityMap[rawCriticality]) {
                log(`and it's mapped to ${criticityMap[rawCriticality]}`);
                this.setCriticality(criticityMap[rawCriticality]);
            } else {
                log(`but it's not mapped`);
            }
        } else {
            log('no criticality found');
        }
    }

    public guessReachField(): void {
        // Split body into lines
        const lines = this.issue.body.split('\n');
        // Find the line containing the reach
        const line = lines.find((l) => l.indexOf('**Portée**') >= 0);
        // If the line is found, extract the reach
        if (line) {
            let raw = line.split(':')[1].trim();
            log('found reach', raw);
            if (raw === 'Très haut') {
                log(`and it's mapped to Very High`);
                this.setReach('Very High');
                return;
            } else if (raw === 'Haut') {
                log(`and it's mapped to High`);
                this.setReach('High');
                return;
            } else if (raw === 'Moyen') {
                log(`and it's mapped to Medium`);
                this.setReach('Medium');
                return;
            } else if (raw === 'Bas') {
                log(`and it's mapped to Low`);
                this.setReach('Low');
                return;
            }
        }
        log('no reach found');
    }

    public guessImpactField(): void {
        // Split body into lines
        const lines = this.issue.body.split('\n');
        // Find the line containing the impact
        const line = lines.find((l) => l.indexOf('**Impact**') >= 0);
        // If the line is found, extract the impact
        if (line) {
            let raw = line.split(':')[1].trim();
            log('found impact', raw);
            if (raw === 'Très haut') {
                log(`and it's mapped to Very High`);
                this.setImpact('Very High');
                return;
            } else if (raw === 'Haut') {
                log(`and it's mapped to High`);
                this.setImpact('High');
                return;
            } else if (raw === 'Moyen') {
                log(`and it's mapped to Medium`);
                this.setImpact('Medium');
                return;
            } else if (raw === 'Bas') {
                log(`and it's mapped to Low`);
                this.setImpact('Low');
                return;
            }
        }
        log('no impact found');
    }

    public guessConfidenceField(): void {
        // Split body into lines
        const lines = this.issue.body.split('\n');
        // Find the line containing the confidence
        const line = lines.find((l) => l.indexOf('**Confiance**') >= 0);
        // If the line is found, extract the confidence
        if (line) {
            let raw = line.split(':')[1].trim();
            log('found confidence', raw);
            if (raw === 'Très haut') {
                log(`and it's mapped to Very High`);
                this.setConfidence('Very High');
                return;
            } else if (raw === 'Haut') {
                log(`and it's mapped to High`);
                this.setConfidence('High');
                return;
            } else if (raw === 'Moyen') {
                log(`and it's mapped to Medium`);
                this.setConfidence('Medium');
                return;
            } else if (raw === 'Bas') {
                log(`and it's mapped to Low`);
                this.setConfidence('Low');
                return;
            }
        }
        log('no confidence found');
    }
}
