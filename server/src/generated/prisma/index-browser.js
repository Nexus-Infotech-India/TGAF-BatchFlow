
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

exports.Prisma.ProductParameterScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  parameterId: 'parameterId',
  isRequired: 'isRequired',
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

exports.Prisma.ProductStandardCategoryScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  categoryId: 'categoryId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StandardParameterScalarFieldEnum = {
  id: 'id',
  name: 'name',
  categoryId: 'categoryId',
  unitId: 'unitId',
  productType: 'productType',
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
  verificationResult: 'verificationResult',
  verificationRemark: 'verificationRemark',
  verifiedById: 'verifiedById',
  verifiedAt: 'verifiedAt',
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
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingDocumentScalarFieldEnum = {
  id: 'id',
  trainingId: 'trainingId',
  sessionId: 'sessionId',
  title: 'title',
  description: 'description',
  fileUrl: 'fileUrl',
  filePath: 'filePath',
  documentType: 'documentType',
  uploadedById: 'uploadedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ParticipantScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  organization: 'organization',
  position: 'position',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainingParticipantScalarFieldEnum = {
  id: 'id',
  trainingId: 'trainingId',
  participantId: 'participantId',
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
  participantId: 'participantId',
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
  participantId: 'participantId',
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

exports.Prisma.FeedbackFormScalarFieldEnum = {
  id: 'id',
  trainingId: 'trainingId',
  sessionId: 'sessionId',
  participantId: 'participantId',
  fileUrl: 'fileUrl',
  filePath: 'filePath',
  submittedAt: 'submittedAt',
  uploadedById: 'uploadedById'
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

exports.Prisma.TrainingInviteTokenScalarFieldEnum = {
  id: 'id',
  token: 'token',
  action: 'action',
  trainingId: 'trainingId',
  participantId: 'participantId',
  email: 'email',
  expiresAt: 'expiresAt',
  used: 'used',
  createdAt: 'createdAt'
};

exports.Prisma.TrainingSessionPhotoScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  photoUrl: 'photoUrl',
  caption: 'caption',
  uploadedById: 'uploadedById',
  createdAt: 'createdAt'
};

exports.Prisma.AuditorScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  userId: 'userId',
  isExternal: 'isExternal',
  firmName: 'firmName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditScalarFieldEnum = {
  id: 'id',
  name: 'name',
  auditType: 'auditType',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  auditorId: 'auditorId',
  auditeeId: 'auditeeId',
  firmName: 'firmName',
  departmentId: 'departmentId',
  objectives: 'objectives',
  scope: 'scope',
  summary: 'summary',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditInspectionItemScalarFieldEnum = {
  id: 'id',
  auditId: 'auditId',
  areaName: 'areaName',
  itemName: 'itemName',
  description: 'description',
  standardReference: 'standardReference',
  isCompliant: 'isCompliant',
  comments: 'comments',
  evidence: 'evidence',
  inspectedById: 'inspectedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FindingScalarFieldEnum = {
  id: 'id',
  auditId: 'auditId',
  title: 'title',
  description: 'description',
  findingType: 'findingType',
  status: 'status',
  priority: 'priority',
  dueDate: 'dueDate',
  assignedToId: 'assignedToId',
  evidence: 'evidence',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  closedAt: 'closedAt'
};

exports.Prisma.CorrectiveActionScalarFieldEnum = {
  id: 'id',
  auditId: 'auditId',
  findingId: 'findingId',
  title: 'title',
  description: 'description',
  actionType: 'actionType',
  assignedToId: 'assignedToId',
  dueDate: 'dueDate',
  status: 'status',
  completedAt: 'completedAt',
  verifiedAt: 'verifiedAt',
  verifiedById: 'verifiedById',
  evidence: 'evidence',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditDocumentScalarFieldEnum = {
  id: 'id',
  auditId: 'auditId',
  title: 'title',
  description: 'description',
  documentType: 'documentType',
  fileUrl: 'fileUrl',
  filePath: 'filePath',
  uploadedById: 'uploadedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PreAuditChecklistItemScalarFieldEnum = {
  id: 'id',
  auditId: 'auditId',
  description: 'description',
  isCompleted: 'isCompleted',
  comments: 'comments',
  responsibleId: 'responsibleId',
  dueDate: 'dueDate',
  completedAt: 'completedAt',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditReminderScalarFieldEnum = {
  id: 'id',
  auditId: 'auditId',
  title: 'title',
  message: 'message',
  dueDate: 'dueDate',
  status: 'status',
  recipientId: 'recipientId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  sentAt: 'sentAt'
};

exports.Prisma.AuditNotificationScalarFieldEnum = {
  id: 'id',
  auditId: 'auditId',
  userId: 'userId',
  title: 'title',
  message: 'message',
  isRead: 'isRead',
  sentAt: 'sentAt',
  readAt: 'readAt'
};

exports.Prisma.VendorScalarFieldEnum = {
  id: 'id',
  vendorCode: 'vendorCode',
  name: 'name',
  address: 'address',
  contactPerson: 'contactPerson',
  contactNumber: 'contactNumber',
  email: 'email',
  gstin: 'gstin',
  bankDetails: 'bankDetails',
  enabled: 'enabled',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RawMaterialProductScalarFieldEnum = {
  id: 'id',
  skuCode: 'skuCode',
  name: 'name',
  category: 'category',
  unitOfMeasurement: 'unitOfMeasurement',
  minReorderLevel: 'minReorderLevel',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  vendorId: 'vendorId'
};

exports.Prisma.PurchaseOrderScalarFieldEnum = {
  id: 'id',
  poNumber: 'poNumber',
  vendorId: 'vendorId',
  orderDate: 'orderDate',
  expectedDate: 'expectedDate',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PurchaseOrderItemScalarFieldEnum = {
  id: 'id',
  purchaseOrderId: 'purchaseOrderId',
  rawMaterialId: 'rawMaterialId',
  quantityOrdered: 'quantityOrdered',
  rate: 'rate',
  quantityReceived: 'quantityReceived',
  status: 'status'
};

exports.Prisma.StockEntryScalarFieldEnum = {
  id: 'id',
  rawMaterialId: 'rawMaterialId',
  warehouseId: 'warehouseId',
  batchNumber: 'batchNumber',
  expiryDate: 'expiryDate',
  quantity: 'quantity',
  entryType: 'entryType',
  referenceId: 'referenceId',
  status: 'status',
  reasonCode: 'reasonCode',
  createdAt: 'createdAt'
};

exports.Prisma.WarehouseScalarFieldEnum = {
  id: 'id',
  name: 'name',
  location: 'location',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CleaningJobScalarFieldEnum = {
  id: 'id',
  rawMaterialId: 'rawMaterialId',
  fromWarehouseId: 'fromWarehouseId',
  toWarehouseId: 'toWarehouseId',
  quantity: 'quantity',
  status: 'status',
  startedAt: 'startedAt',
  finishedAt: 'finishedAt'
};

exports.Prisma.CleaningLogScalarFieldEnum = {
  id: 'id',
  cleaningJobId: 'cleaningJobId',
  from: 'from',
  to: 'to',
  dateTime: 'dateTime',
  quantity: 'quantity',
  status: 'status',
  fromWarehouseId: 'fromWarehouseId',
  toWarehouseId: 'toWarehouseId'
};

exports.Prisma.UnfinishedStockScalarFieldEnum = {
  id: 'id',
  cleaningJobId: 'cleaningJobId',
  processingJobId: 'processingJobId',
  skuCode: 'skuCode',
  quantity: 'quantity',
  reasonCode: 'reasonCode',
  warehouseId: 'warehouseId',
  createdAt: 'createdAt'
};

exports.Prisma.ProcessingJobScalarFieldEnum = {
  id: 'id',
  inputRawMaterialId: 'inputRawMaterialId',
  outputSkuId: 'outputSkuId',
  quantityInput: 'quantityInput',
  quantityOutput: 'quantityOutput',
  conversionRatio: 'conversionRatio',
  startedAt: 'startedAt',
  finishedAt: 'finishedAt',
  status: 'status'
};

exports.Prisma.FinishedGoodScalarFieldEnum = {
  id: 'id',
  skuCode: 'skuCode',
  name: 'name',
  category: 'category',
  unitOfMeasurement: 'unitOfMeasurement',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ByProductScalarFieldEnum = {
  id: 'id',
  processingJobId: 'processingJobId',
  skuCode: 'skuCode',
  quantity: 'quantity',
  warehouseId: 'warehouseId',
  tag: 'tag',
  createdAt: 'createdAt'
};

exports.Prisma.CurrentStockScalarFieldEnum = {
  id: 'id',
  rawMaterialId: 'rawMaterialId',
  warehouseId: 'warehouseId',
  currentQuantity: 'currentQuantity',
  lastUpdated: 'lastUpdated'
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

exports.AuditType = exports.$Enums.AuditType = {
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL'
};

exports.AuditStatus = exports.$Enums.AuditStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DELAYED: 'DELAYED'
};

exports.FindingType = exports.$Enums.FindingType = {
  OBSERVATION: 'OBSERVATION',
  NON_CONFORMITY: 'NON_CONFORMITY',
  MAJOR_NON_CONFORMITY: 'MAJOR_NON_CONFORMITY',
  OPPORTUNITY_FOR_IMPROVEMENT: 'OPPORTUNITY_FOR_IMPROVEMENT'
};

exports.FindingStatus = exports.$Enums.FindingStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  VERIFIED: 'VERIFIED',
  CLOSED: 'CLOSED'
};

exports.Priority = exports.$Enums.Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

exports.AuditDocumentType = exports.$Enums.AuditDocumentType = {
  CHECKLIST: 'CHECKLIST',
  PROCEDURE: 'PROCEDURE',
  CERTIFICATE: 'CERTIFICATE',
  EVIDENCE: 'EVIDENCE',
  REPORT: 'REPORT',
  OTHER: 'OTHER'
};

exports.Prisma.ModelName = {
  ActivityLog: 'ActivityLog',
  Batch: 'Batch',
  ExportLog: 'ExportLog',
  Methodology: 'Methodology',
  Notification: 'Notification',
  Permission: 'Permission',
  Product: 'Product',
  ProductParameter: 'ProductParameter',
  Role: 'Role',
  UnitOfMeasurement: 'UnitOfMeasurement',
  User: 'User',
  Standard: 'Standard',
  StandardCategory: 'StandardCategory',
  ProductStandardCategory: 'ProductStandardCategory',
  StandardParameter: 'StandardParameter',
  StandardDefinition: 'StandardDefinition',
  BatchParameterValue: 'BatchParameterValue',
  TrainingCalendar: 'TrainingCalendar',
  Training: 'Training',
  TrainingSession: 'TrainingSession',
  TrainingDocument: 'TrainingDocument',
  Participant: 'Participant',
  TrainingParticipant: 'TrainingParticipant',
  Attendance: 'Attendance',
  TrainingPhoto: 'TrainingPhoto',
  TrainingFeedback: 'TrainingFeedback',
  FeedbackForm: 'FeedbackForm',
  TrainingFollowup: 'TrainingFollowup',
  TrainingNotification: 'TrainingNotification',
  TrainingInviteToken: 'TrainingInviteToken',
  TrainingSessionPhoto: 'TrainingSessionPhoto',
  Auditor: 'Auditor',
  Audit: 'Audit',
  AuditInspectionItem: 'AuditInspectionItem',
  Department: 'Department',
  Finding: 'Finding',
  CorrectiveAction: 'CorrectiveAction',
  AuditDocument: 'AuditDocument',
  PreAuditChecklistItem: 'PreAuditChecklistItem',
  AuditReminder: 'AuditReminder',
  AuditNotification: 'AuditNotification',
  Vendor: 'Vendor',
  RawMaterialProduct: 'RawMaterialProduct',
  PurchaseOrder: 'PurchaseOrder',
  PurchaseOrderItem: 'PurchaseOrderItem',
  StockEntry: 'StockEntry',
  Warehouse: 'Warehouse',
  CleaningJob: 'CleaningJob',
  CleaningLog: 'CleaningLog',
  UnfinishedStock: 'UnfinishedStock',
  ProcessingJob: 'ProcessingJob',
  FinishedGood: 'FinishedGood',
  ByProduct: 'ByProduct',
  CurrentStock: 'CurrentStock'
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
