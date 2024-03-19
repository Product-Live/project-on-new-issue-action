class Constants {
    public static PROJECT_TITLE = 'Product-Live';
    public static PROJECT_FIELD_ISSUE_NUMBER = 'Id';
    public static PROJECT_FIELD_CREATION_DATE = 'Creation date';
    public static PROJECT_FIELD_STATUS = 'Status';
    public static PROJECT_FIELD_TYPE = 'Type';
    public static PROJECT_FIELD_CRITICALITY = 'Criticality';
    public static PROJECT_FIELD_ORIGIN = 'Origin';
    public static PROJECT_FIELD_IMPACT = 'Impact';
    public static PROJECT_FIELD_CONFIDENCE = 'Confidence';
    public static PROJECT_FIELD_REACH = 'Reach';
    public static LABEL_TEST_ACCOUNT_STAGE = 'Test account stage';
    public static TEST_ACCOUNT_MAIN_USER_EMAIL = 'clement.aubert@product-live.com';
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

export { Constants, IssueType, IssueOrigin };
