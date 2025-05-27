import Joi from 'joi';

// Audit validation schema
export const validateAudit = (audit: any) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    auditType: Joi.string().required().valid(
      'INTERNAL', 'EXTERNAL', 'COMPLIANCE', 'PROCESS', 
      'QUALITY', 'SAFETY', 'SUPPLIER', 'SYSTEM'
    ),
    status: Joi.string().valid(
      'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED'
    ),
    startDate: Joi.date().required(),
    endDate: Joi.date().allow(null),
    
    // Handle different fields based on audit type
    auditorId: Joi.string().when('auditType', {
      is: Joi.valid('INTERNAL'),
      then: Joi.string().optional(),  // Optional for internal audits
      otherwise: Joi.when('auditorName', {
        is: Joi.exist(),
        then: Joi.string().optional(), // Optional if auditorName exists (for external)
        otherwise: Joi.string().required() // Required for other cases
      })
    }),
    
    // Fields for internal audits
    auditorUserId: Joi.string().when('auditType', {
      is: 'INTERNAL',
      then: Joi.when('auditorId', {
        is: Joi.exist(),
        then: Joi.string().optional(),
        otherwise: Joi.string().required()
      }),
      otherwise: Joi.string().optional()
    }),
    
    // Fields for external audits
    auditorName: Joi.string().when('auditType', {
      is: 'EXTERNAL',
      then: Joi.when('auditorId', {
        is: Joi.exist(),
        then: Joi.string().optional(),
        otherwise: Joi.string().required()
      }),
      otherwise: Joi.string().optional()
    }),
    auditorEmail: Joi.string().when('auditType', {
      is: 'EXTERNAL',
      then: Joi.when('auditorId', {
        is: Joi.exist(),
        then: Joi.string().optional(),
        otherwise: Joi.string().required()
      }),
      otherwise: Joi.string().optional()
    }),
    
    auditeeId: Joi.string().allow(null, ''),
    firmName: Joi.string().allow(null, ''),
    departmentId: Joi.string().allow(null, ''),
    objectives: Joi.string().allow(null, ''),
    scope: Joi.string().allow(null, ''),
    summary: Joi.string().allow(null, ''),
  });

  return schema.validate(audit);
};


// Finding validation schema
export const validateFinding = (finding: any) => {
  const schema = Joi.object({
    auditId: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    findingType: Joi.string().required().valid(
      'OBSERVATION', 'NON_CONFORMITY', 'MAJOR_NON_CONFORMITY', 'OPPORTUNITY_FOR_IMPROVEMENT'
    ),
    status: Joi.string().valid(
      'OPEN', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED'
    ),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
    dueDate: Joi.date().allow(null),
    assignedToId: Joi.string().allow(null),
    evidence: Joi.string().allow(null, ''),
  });

  return schema.validate(finding);
};

// Corrective Action validation schema
export const validateCorrectiveAction = (action: any) => {
  const schema = Joi.object({
    auditId: Joi.string().required(),
    findingId: Joi.string().allow(null),
    title: Joi.string().required(),
    description: Joi.string().required(),
    actionType: Joi.string().required().valid('CORRECTIVE', 'PREVENTIVE'),
    assignedToId: Joi.string().required(),
    dueDate: Joi.date().required(),
    status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'),
    evidence: Joi.string().allow(null, ''),
    verifiedById: Joi.string().allow(null),
  });

  return schema.validate(action);
};

// Department validation schema
export const validateDepartment = (department: any) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ''),
  });

  return schema.validate(department);
};

// Audit Document validation schema
export const validateAuditDocument = (document: any) => {
  const schema = Joi.object({
    auditId: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    documentType: Joi.string().required().valid(
      'CHECKLIST', 'PROCEDURE', 'CERTIFICATE', 'EVIDENCE', 'REPORT', 'OTHER'
    ),
    fileUrl: Joi.string().required(),
    filePath: Joi.string().allow(null, ''),
  });

  return schema.validate(document);
};

// Reminder validation schema
export const validateReminder = (reminder: any) => {
  const schema = Joi.object({
    auditId: Joi.string().required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    dueDate: Joi.date().required(),
    status: Joi.string().valid('PENDING', 'SENT', 'DISMISSED'),
    recipientId: Joi.string().required(),
  });

  return schema.validate(reminder);
};

export const validatePreAuditChecklist = (data: any) => {
  const itemSchema = Joi.object({
    description: Joi.string().required(),
    isCompleted: Joi.boolean().default(false),
    comments: Joi.string().allow(null, ''),
    responsibleId: Joi.string().required(),
    dueDate: Joi.date().allow(null, ''),
  });

  const schema = Joi.object({
    auditId: Joi.string().required(),
    items: Joi.array().items(itemSchema).min(1).required(),
  });

  return schema.validate(data);
};

// Add these validation schemas

// Report settings validation
export const validateReportSettings = (settings: any) => {
  const schema = Joi.object({
    includeEvidence: Joi.boolean().default(true),
    includeActions: Joi.boolean().default(true),
    includeSummary: Joi.boolean().default(true),
  });

  return schema.validate(settings);
};

// Corrective action validation
