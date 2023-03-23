export type GithubLabel = {
    name: string;
    id: string;
}

export type GithubIssue = {
    id: string;
    title: string;
    body: string;
    labels: GithubLabel[];
    trackedInIssues: GithubIssue[];
}

export type ProjectFieldValue = { date: string } | { iterationId: string } | { number: number } | { singleSelectOptionId: string } | { text: string };