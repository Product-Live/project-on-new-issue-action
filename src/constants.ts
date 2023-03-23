class Constants {
    public static PROJECT_TITLE = 'Product-Live';
    public static PROJECT_FIELD_ISSUE_NUMBER = 'Issue Number';
    public static PROJECT_FIELD_CREATION_DATE = 'Creation date';
    public static PROJECT_FIELD_STATUS = 'Status';
    public static PROJECT_FIELD_TYPE = 'Type';
    public static PROJECT_FIELD_CRITICITY = 'Criticity';
    public static PROJECT_FIELD_ORIGIN = 'Origin';
    public static PROJECT_FIELD_IMPACT = 'Impact';
    public static PROJECT_FIELD_CONFIDENCE = 'Confidence';
}

enum IssueType {
    EPIC = 'Epic',
    USER_STORY = 'User Story',
    BUG = 'Bug',
    TASK = 'Task',
    DEVOPS = 'DevOps',
    UNKNOWN = 'Unknown'
}

enum IssueOrigin {
    CUSTOMER_SUCCESS = 'Customer Success',
    DEV = 'Dev',
    DEVOPS = 'Devops',
    PRODUCT = 'Produit',
    QA = 'QA',
    SERVICE = 'Service',
    SUPPORT = 'Support',
    UNKNOWN = 'Unknown'
}

enum IssueCriticality {
    BLOCKER = 'Blocker - 8',
    CRITICAL = 'Critical - 5',
    MAJOR = 'Major - 3',
    MINOR = 'Minor - 1'
}

export {
    Constants,
    IssueType,
    IssueOrigin,
    IssueCriticality
}