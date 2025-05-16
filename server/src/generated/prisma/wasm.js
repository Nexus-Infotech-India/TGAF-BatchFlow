
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.ActivityLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  batchId: 'batchId',
  action: 'action',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.BatchScalarFieldEnum = {
  id: 'id',
  batchNumber: 'batchNumber',
  productId: 'productId',
  dateOfProduction: 'dateOfProduction',
  bestBeforeDate: 'bestBeforeDate',
  sampleAnalysisStarted: 'sampleAnalysisStarted',
  sampleAnalysisCompleted: 'sampleAnalysisCompleted',
  sampleAnalysisStatus: 'sampleAnalysisStatus',
  makerId: 'makerId',
  checkerId: 'checkerId',
  status: 'status',
  rejectionRemarks: 'rejectionRemarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExportLogScalarFieldEnum = {
  id: 'id',
  fileName: 'fileName',
  exportType: 'exportType',
  exportedBy: 'exportedBy',
  exportedAt: 'exportedAt'
};

exports.Prisma.MethodologyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  procedure: 'procedure',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  batchId: 'batchId',
  message: 'message',
  type: 'type',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  action: 'action',
  resource: 'resource',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UnitOfMeasurementScalarFieldEnum = {
  id: 'id',
  name: 'name',
  symbol: 'symbol',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  password: 'password',
  roleId: 'roleId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StandardScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  description: 'description',
  categoryId: 'categoryId',
  createdById: 'createdById',
  modifiedById: 'modifiedById',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StandardCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StandardParameterScalarFieldEnum = {
  id: 'id',
  name: 'name',
  categoryId: 'categoryId',
  description: 'description',
  dataType: 'dataType',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StandardDefinitionScalarFieldEnum = {
  id: 'id',
  parameterId: 'parameterId',
  standardValue: 'standardValue',
  unitId: 'unitId',
  methodologyId: 'methodologyId',
  createdById: 'createdById',
  modifiedById: 'modifiedById',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BatchParameterValueScalarFieldEnum = {
  id: 'id',
  batchId: 'batchId',
  parameterId: 'parameterId',
  value: 'value',
  unitId: 'unitId',
  methodologyId: 'methodologyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingCalendarScalarFieldEnum = {
  id: 'id',
  month: 'month',
  year: 'year',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  trainingType: 'trainingType',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  location: 'location',
  maxParticipants: 'maxParticipants',
  trainerId: 'trainerId',
  calendarId: 'calendarId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingSessionScalarFieldEnum = {
  id: 'id',
  trainingId: 'trainingId',
  title: 'title',
  description: 'description',
  startTime: 'startTime',
  endTime: 'endTime',
  venue: 'venue',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingDocumentScalarFieldEnum = {
  id: 'id',
  trainingId: 'trainingId',
  title: 'title',
  description: 'description',
  fileUrl: 'fileUrl',
  documentType: 'documentType',
  uploadedById: 'uploadedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingParticipantScalarFieldEnum = {
  id: 'id',
  trainingId: 'trainingId',
  userId: 'userId',
  inviteSent: 'inviteSent',
  inviteSentAt: 'inviteSentAt',
  inviteAccepted: 'inviteAccepted',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  id: 'id',
  trainingId: 'trainingId',
  sessionId: 'sessionId',
  userId: 'userId',
  status: 'status',
  remarks: 'remarks',
  signatureUrl: 'signatureUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingPhotoScalarFieldEnum = {
  id: 'id',
  trainingId: 'trainingId',
  photoUrl: 'photoUrl',
  caption: 'caption',
  uploadedById: 'uploadedById',
  createdAt: 'createdAt'
};

exports.Prisma.TrainingFeedbackScalarFieldEnum = {
  id: 'id',
  trainingId: 'trainingId',
  userId: 'userId',
  contentRating: 'contentRating',
  trainerRating: 'trainerRating',
  materialRating: 'materialRating',
  venueRating: 'venueRating',
  overallRating: 'overallRating',
  comments: 'comments',
  suggestedImprovements: 'suggestedImprovements',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingFollowupScalarFieldEnum = {
  id: 'id',
  trainingId: 'trainingId',
  title: 'title',
  description: 'description',
  dueDate: 'dueDate',
  isCompleted: 'isCompleted',
  assignedToId: 'assignedToId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  completedAt: 'completedAt'
};

exports.Prisma.TrainingNotificationScalarFieldEnum = {
  id: 'id',
  trainingId: 'trainingId',
  userId: 'userId',
  title: 'title',
  message: 'message',
  isRead: 'isRead',
  sentAt: 'sentAt',
  readAt: 'readAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.SampleAnalysisStatus = exports.$Enums.SampleAnalysisStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.BatchStatus = exports.$Enums.BatchStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  BATCH_SUBMITTED: 'BATCH_SUBMITTED',
  BATCH_APPROVED: 'BATCH_APPROVED',
  BATCH_REJECTED: 'BATCH_REJECTED',
  SYSTEM: 'SYSTEM'
};

exports.StandardStatus = exports.$Enums.StandardStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DEPRECATED: 'DEPRECATED'
};

exports.ParameterDataType = exports.$Enums.ParameterDataType = {
  TEXT: 'TEXT',
  FLOAT: 'FLOAT',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  PERCENTAGE: 'PERCENTAGE',
  DATE: 'DATE'
};

exports.TrainingType = exports.$Enums.TrainingType = {
  TECHNICAL: 'TECHNICAL',
  SAFETY: 'SAFETY',
  COMPLIANCE: 'COMPLIANCE',
  ONBOARDING: 'ONBOARDING',
  PROFESSIONAL_DEVELOPMENT: 'PROFESSIONAL_DEVELOPMENT',
  WORKSHOP: 'WORKSHOP',
  SEMINAR: 'SEMINAR'
};

exports.TrainingStatus = exports.$Enums.TrainingStatus = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  POSTPONED: 'POSTPONED'
};

exports.DocumentType = exports.$Enums.DocumentType = {
  COURSE_MATERIAL: 'COURSE_MATERIAL',
  PRESENTATION: 'PRESENTATION',
  AGENDA: 'AGENDA',
  GUIDELINE: 'GUIDELINE',
  CERTIFICATE: 'CERTIFICATE',
  ASSESSMENT: 'ASSESSMENT',
  FEEDBACK_FORM: 'FEEDBACK_FORM',
  OTHER: 'OTHER'
};

exports.AttendanceStatus = exports.$Enums.AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED'
};

exports.Prisma.ModelName = {
  ActivityLog: 'ActivityLog',
  Batch: 'Batch',
  ExportLog: 'ExportLog',
  Methodology: 'Methodology',
  Notification: 'Notification',
  Permission: 'Permission',
  Product: 'Product',
  Role: 'Role',
  UnitOfMeasurement: 'UnitOfMeasurement',
  User: 'User',
  Standard: 'Standard',
  StandardCategory: 'StandardCategory',
  StandardParameter: 'StandardParameter',
  StandardDefinition: 'StandardDefinition',
  BatchParameterValue: 'BatchParameterValue',
  TrainingCalendar: 'TrainingCalendar',
  Training: 'Training',
  TrainingSession: 'TrainingSession',
  TrainingDocument: 'TrainingDocument',
  TrainingParticipant: 'TrainingParticipant',
  Attendance: 'Attendance',
  TrainingPhoto: 'TrainingPhoto',
  TrainingFeedback: 'TrainingFeedback',
  TrainingFollowup: 'TrainingFollowup',
  TrainingNotification: 'TrainingNotification'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
