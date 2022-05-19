exports.CustomerSubscription = Object.freeze({
    FOURTEEN_FREE_TRIAL: 1,
    NINETY_FREE_TRIAL: 2,
    ADMIN: 3,
    ADMIN_PLUS: 4,
    STORAGE_PLUS: 5,
    ADMIN_BETA: 6,
    ADMIN_PLUS_BETA: 7,
    STORAGE_PLUS_BETA: 8,
  });
  
  exports.FileBusyStatus = Object.freeze({
    NOT_BUSY: 0,
    BUSY_FILE_ACTION: 1,
    BUSY_FILE_TRANSFER: 2,
    BUSY_FIX_DUPLICATES: 3,
  });
  
  exports.EmailLogType = Object.freeze({
    REPORT_COMPLETE: 1,
    ACTION_REQUIRED: 2,
    FILES_PENDING_TRASH: 3,
    FILES_TRASHED: 4,
    ACTION_REQUIRED_REMOVED: 5,
    FILES_DELETED: 6,
    FREE_TRIAL: 7,
    AUTO_FLAG: 8,
  });
  
  exports.AuditLogType = Object.freeze({
    LOGIN: 1,
    ENABLE_DELETE: 2,
    DISABLE_DELETE: 3,
    FILE_DELETED: 4,
    FILE_TRASHED: 5,
    FILE_RESTORED: 6,
    USER_FLAGGED: 7,
    USER_FLAG_REMOVED: 8,
    RUN_REPORT: 9,
    REPORT_NAME_UPDATED: 10,
    FILE_SCHEDULED_FOR_TRASH: 11,
    FILE_SCHEDULED_FOR_TRASH_REMOVED: 12,
    STORAGE_REPORT_CREATED: 13,
    SERVICE_ACCOUNT_CREATED: 14,
    SERVICE_ACCOUNT_UPDATED: 15,
    SERVICE_ACCOUNT_REMOVED: 16,
    SERVICE_ACCOUNT_TESTED: 17,
    DELETE_SHARED_DRIVE: 18,
    DELETE_SHARED_DRIVE_CONTENTS: 19,
    TRANSFER_DRIVE_OWNERSHIP: 20,
    TRANSFER_TO_GCP: 21,
  });
  
  exports.TransferDriveOwnershipState = Object.freeze({
    ORIGINAL_OWNER: 1,
    NEW_OWNER: 2,
  });
  
  exports.ContactType = Object.freeze({
    TERMS_OF_SERVICE: 1,
    REPORTS: 2,
    TOS_SIGNER: 3,
  });
  
  exports.CustomerContactType = Object.freeze({
    TERMS_OF_SERVICE: 1,
    REPORT: 2,
  });
  
  exports.ServiceAccountType = Object.freeze({
    CLASSROOM_CACHING: 1,
    STORAGE_REPORTS: 2,
  });
  
  exports.UserLogType = Object.freeze({
    LOGIN: 1,
    LOGOUT: 2,
  });
  
  exports.LogType = Object.freeze({
    ADD: 1,
    UPDATE: 2,
    DELETE: 3,
  });
  
  exports.StorageReportStatus = Object.freeze({
    CREATED: 1,
    RUNNING: 2,
    PENDING: 3,
    COMPLETE: 4,
  });
  
  exports.ClassroomCourseState = Object.freeze({
    COURSE_STATE_UNSPECIFIED: 1,
    ACTIVE: 2,
    ARCHIVED: 3,
    PROVISIONED: 4,
    DECLINED: 5,
    SUSPENDED: 6,
  });
  
  exports.ClassroomCourseCourseWorkSubmissionMode = Object.freeze({
    SUBMISSION_MODIFICATION_MODE_UNSPECIFIED: 1,
    MODIFIABLE_UNTIL_TURNED_IN: 2,
    MODIFIABLE: 3,
  });
  
  exports.ClassroomCourseCourseWorkAssigneeMode = Object.freeze({
    ASSIGNEE_MODE_UNSPECIFIED: 1,
    ALL_STUDENTS: 2,
    INDIVIDUAL_STUDENTS: 3,
  });
  
  exports.ClassroomCourseCourseWorkType = Object.freeze({
    COURSE_WORK_TYPE_UNSPECIFIED: 1,
    ASSIGNMENT: 2,
    SHORT_ANSWER_QUESTION: 3,
    MULTIPLE_CHOICE_QUESTION: 4,
  });
  
  exports.ClassroomCourseCourseWorkState = Object.freeze({
    COURSE_WORK_STATE_UNSPECIFIED: 1,
    PUBLISHED: 2,
    DRAFT: 3,
    DELETED: 4,
  });
  
  exports.ClassroomCourseCourseWorkStudentSubmissionState = Object.freeze({
    SUBMISSION_STATE_UNSPECIFIED: 1,
    NEW: 2,
    CREATED: 3,
    TURNED_IN: 4,
    RETURNED: 5,
    RECLAIMED_BY_STUDENT: 6,
  });
  
  exports.JobType = Object.freeze({
    TRANSFER_TO_GCP: 1,
  });
  
  exports.JobStatus = Object.freeze({
    CREATED: 1,
    QUEUED: 2,
    RUNNING: 3,
    FAILED: 4,
    COMPLETED: 5,
    ERRORED: 6,
  });
  
  exports.Module = Object.freeze({
    // KEEP IN SYNC WITH /src/app/services/modules.service.ts
    DASHBOARD: 1,
    USERS: 2,
    GROUPS: 3,
    ACCOUNT: 4,
    CLASSROOM: 5,
    ANALYTICS: 6,
    REPORTS: 7,
    ORGANIZATIONAL_UNITS: 8,
    BUILDINGS: 9,
    AUTOMATION: 10,
  });
  
  exports.FilterType = Object.freeze({
    // KEEP IN SYNC WITH /src/app/services/filters.service.ts
    ADMIN_USER: 1,
    USER: 2,
    FILE: 3,
    DUPLICATE_FILE: 4,
    DRIVE: 5,
    JOB: 6,
    BUILDING: 7,
    COURSE: 8,
    ANALYTICS_DEVICE: 9,
    ANALYTICS_MEETING: 10,
    ANALYTICS_STUDENT: 11,
    ANALYTICS_TEACHER: 12,
    ANALYTICS_COURSE_WORK: 13,
    WORKFLOW: 14,
  });
  
  exports.AutomationWorkflowTypes = Object.freeze({
    SUBSCRIPTION: 1,
    SCHEDULE: 2,
    SPECIFIC_DATE: 3
  });
  
  exports.AutomationObjects = Object.freeze({
    USER: 1,
    GOOGLE_DRIVE: 2,
    FILE: 3,
    CHROME_OS_DEVICE: 35
  });
  
  exports.AutomationActivityEvents = Object.freeze({
    USER_CREATION: 1,
    USER_ORGUNIT_CHANGE: 6,
    USER_SHARING_PERMISSIONS_CHANGE: 7,
  });
  
  exports.AutomationWorkflowActions = Object.freeze({
    SEND_EMAIL: 1,
    ADD_LICENSES: 2,
    DELETE_LICENSES: 3,
    ADD_MEMBERS: 4,
    DELETE_PERMISSIONS: 7,
    DELAY_FOR_A_SET_AMOUNT_OF_TIME: 9,
    DELAY_UNTIL_A_DAY_OR_TIME: 10,
    CONDITIONAL: 11,
    ADD_PERMISSIONS: 12,
    UPDATE_PERMISSIONS: 13,
    CHROME_OS_DEVICE_REPORT: 14
  });