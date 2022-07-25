export type GithubLabel = {
    name: string;
    id: string;
}

export type GithubIssue = {
    id: string;
    body: string;
    labels: GithubLabel[];
}

export type ProjectFieldValue = { date: string } | { iterationId: string } | { number: number } | { singleSelectOptionId: string } | { text: string };