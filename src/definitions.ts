export type GithubLabel = {
    name: string;
    id: string;
};

export type ProjectItem = {
    id: string;
    project: {
        id: string;
    };
    fieldValues: {
        nodes: any[];
    };
};

export type GithubIssue = {
    id: string;
    number: number;
    title: string;
    body: string;
    labels: GithubLabel[];
    trackedInIssues: GithubIssue[];
    projectItems: ProjectItem[];
};

export type ProjectFieldValue =
    | { date: string }
    | { iterationId: string }
    | { number: number }
    | { singleSelectOptionId: string }
    | { text: string };
