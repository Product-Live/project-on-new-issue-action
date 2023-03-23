import {GitHub} from '@actions/github/lib/utils';
import {GraphQlQueryResponseData} from '@octokit/graphql';
import {Constants, IssueCriticality, IssueOrigin, IssueType} from './constants';
import {GithubIssue, ProjectFieldValue} from './definitions';

export class IssueUtils {

    public type: IssueType;

    constructor(readonly octokit: InstanceType<typeof GitHub>, readonly projectId: string, readonly issue: GithubIssue) {
    }

    private setType(type: IssueType): void {
        this.type = type;
    }

    private async setProjectFieldValue(itemId: string, fieldId: string, value: ProjectFieldValue): Promise<void> {
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

    async addIssueToProjectAndFillFields(): Promise<void> {
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
        
        const fieldIssueNumber = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_ISSUE_NUMBER);
        if (fieldIssueNumber) {
            console.log('Setting issue number in project');
            await this.setProjectFieldValue(projectItemId, fieldIssueNumber.id, { text: issueNumber.toString() });
        }

        const fieldCreationDate = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_CREATION_DATE);
        if (fieldCreationDate) {
            console.log('Setting issue creation date in project');
            await this.setProjectFieldValue(projectItemId, fieldCreationDate.id, { date: issueCreatedAt });
        }

        const statusField = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_STATUS);
        if (statusField) {
            console.log('Setting issue status in project');
            await this.setProjectFieldValue(projectItemId, statusField.id, { singleSelectOptionId: statusField.options.find((opt) => opt.name === 'To Study').id });
        }
        const additionalInfos = this.getAdditionalInfos();
        if (additionalInfos) {
            const typeField = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_TYPE);
            const originField = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_ORIGIN);
            const criticityField = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_CRITICITY);
            const impactField = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_IMPACT);
            const confidenceField = projectFields.node.fields.nodes.find((n) => n.name === Constants.PROJECT_FIELD_CONFIDENCE);
            console.log('found additional infos', additionalInfos);
            if (typeField && additionalInfos.typeContains) {
                console.log('Setting issue type in project');
                await this.setProjectFieldValue(projectItemId, typeField.id, { singleSelectOptionId: typeField.options.find((opt) => opt.name.indexOf(additionalInfos.typeContains) >= 0).id });
            }
            if (typeField && additionalInfos.origin) {
                console.log('Setting issue origin in project');
                await this.setProjectFieldValue(projectItemId, originField.id, { singleSelectOptionId: originField.options.find((opt) => opt.name.indexOf(additionalInfos.origin) >= 0).id });
            }
            if (criticityField && additionalInfos.criticity) {
                console.log('Setting issue criticity in project');
                await this.setProjectFieldValue(projectItemId, criticityField.id, { singleSelectOptionId: criticityField.options.find((opt) => opt.name.indexOf(additionalInfos.criticity) >= 0).id });
            }
            if (impactField && additionalInfos.impact) {
                console.log('Setting issue impact in project');
                await this.setProjectFieldValue(projectItemId, impactField.id, { singleSelectOptionId: impactField.options.find((opt) => opt.name.indexOf(additionalInfos.impact) >= 0).id });
            }
            if (confidenceField && additionalInfos.confidence) {
                console.log('Setting issue confidence in project');
                await this.setProjectFieldValue(projectItemId, confidenceField.id, { singleSelectOptionId: confidenceField.options.find((opt) => opt.name.indexOf(additionalInfos.confidence) >= 0).id });
            }
        }
    }

    public guessIssueType(): void {
        if (this.issue.title.indexOf('🐞') >=0) {
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

    public getAdditionalInfos(): { typeContains: string; origin?: string; criticity?: string; impact?: string; confidence?: string } | undefined {
        this.guessIssueType();
        return {
            origin: this.getOrigin(),
            criticity: this.getCriticity(),
            typeContains: 'Bug'
        }
    }

    private getIssueBugInfo(): { typeContains: string; origin?: string, criticity?: string } {
        return {
            origin: this.getOrigin(),
            criticity: this.getCriticity(),
            typeContains: 'Bug'
        }
    }

    private getIssueTechnicalImprovementInfo(): { typeContains: string; origin: string } {
        return {
            typeContains: 'Task',
            origin: 'Dév'
        }
    }

    private getIssueFeatureFlagInfo(): { typeContains: string; origin?: string } {
        return {
            origin: this.getOrigin(),
            typeContains: 'Task'
        }
    }

    private getIssueUserStoryInfo(): { typeContains: string; origin?: string, criticity?: string; impact?: string; confidence?: string } {
        return {
            origin: this.getOrigin(),
            criticity: this.getCriticity(),
            confidence: this.getConfidence(),
            impact: this.getImpact(),
            typeContains: 'User Story'
        }
    }

    private getIssueEpicInfo(): { typeContains: string; origin?: string, criticity?: string; impact?: string; confidence?: string } {
        return {
            origin: this.getOrigin(),
            criticity: this.getCriticity(),
            confidence: this.getConfidence(),
            impact: this.getImpact(),
            typeContains: 'Epic'
        }
    }

    private getOrigin(): string | undefined {
        const match = this.issue.body.match(/Origine[ ]?: ([^\n]*)/m);
        let origin = match ? match[1].trim() : undefined;
        if (origin === 'CS') {
            origin = IssueOrigin.CUSTOMER_SUCCESS;
        }
        if (!origin) {
            origin = IssueOrigin.PRODUCT;
        }
        return origin
    }

    private getImpact(): string | undefined {
        const impactMap = {
            'Très haut': 'Very High',
            'Haut': 'High',
            'Moyen': 'Medium',
            'Bas': 'Low'
        };
        const match = this.issue.body.match(/\*\*impact\*\*[^?]*\?[ ]?: ([^\n]*)/m);
        return match ? impactMap[match[1].trim()] : undefined;
    }

    private getConfidence(): string | undefined {
        const confidenceMap = {
            'Très haut': 'Very High',
            'Haut': 'High',
            'Moyen': 'Medium',
            'Bas': 'Low'
        };
        const match = this.issue.body.match(/\*\*niveau de confiance\*\*[^?]*\?[ ]?: ([^\n]*)/m);
        return match ? confidenceMap[match[1].trim()] : undefined;
    }

    private getCriticity(): string | undefined {
        const criticityMap = {
            Bloquant: 'Blocker',
            Critique: 'Critical',
            Majeur: 'Major',
            Mineur: 'Minor'
        };
        const match = this.issue.body.match(/\*\*Criticality\*\*[^?]*\?[ ]?: ([^\n]*)/m);
        let criticality = match ? match[1].trim() : undefined;
        console.log('found criticality', criticality);
        if (!criticality) {
            criticality = IssueCriticality.MINOR;
        }
        return criticality;
    }
}