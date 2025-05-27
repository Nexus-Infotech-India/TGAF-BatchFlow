import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { validateAuditDocument, validatePreAuditChecklist } from '../../utils/validator';
import { handleApiError } from '../../utils/handler/errorHandler';
import { createActivityLog } from '../../utils/handler/activityLogger';
import { deleteFileFromSupabase, uploadFileToSupabase } from '../../service/supabase';

const prisma = new PrismaClient();

// Send audit notifications to relevant departments/users
export const sendAuditNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auditId, recipientIds, message, title } = req.body;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        department: true,
      },
    });

    if (!audit) {
       res.status(404).json({ error: 'Audit not found' });return;
    }

    // Create notifications for each recipient
    const notifications = await Promise.all(
      recipientIds.map(async (userId: string) => {
        return prisma.auditNotification.create({
          data: {
            auditId,
            userId,
            title: title || `New Audit: ${audit.name}`,
            message: message || `You have been notified about an upcoming audit: ${audit.name}`,
            isRead: false,
            sentAt: new Date(),
          },
        });
      })
    );

    // Log activity
    if (!req.user || !req.user.id) {
       res.status(401).json({ error: 'Unauthorized: User not found' });return;
    }
    await createActivityLog({
      userId: req.user.id,
      action: 'AUDIT_NOTIFICATIONS_SENT',
      details: `Sent notifications for audit: ${audit.name} to ${recipientIds.length} recipients`,
    });

     res.status(200).json({
      message: 'Audit notifications sent successfully',
      count: notifications.length,
      notifications,
    });return;
  } catch (error) {
     handleApiError(error, res);return;
  }
};

// Upload audit document
export const uploadAuditDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request data
    const { auditId, title, description, documentType } = req.body;
    
    const validationInput = {
      auditId,
      title,
      description,
      documentType,
      fileUrl: 'placeholder', // Will be replaced with actual URL
      filePath: 'placeholder' // Will be replaced with actual path
    };
    
    const { error } = validateAuditDocument(validationInput);
    if (error) {
       res.status(400).json({ error: error.details[0].message });return;
    }

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
       res.status(404).json({ error: 'Audit not found' });return;
    }

    if (!req.user || !req.user.id) {
       res.status(401).json({ error: 'Unauthorized: User not found' });return;
    }

    // Check if file was uploaded
    if (!req.file) {
       res.status(400).json({ error: 'No file uploaded' });return;
    }

    // Upload file to Supabase
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    
    const { url, path, error: uploadError } = await uploadFileToSupabase(
      fileBuffer,
      fileName,
      'audit-documents', // Use a dedicated bucket for audit documents
      `audit-${auditId}` // Store files in a folder named after the audit ID
    );

    if (uploadError || !url) {
       res.status(500).json({ 
        error: 'Failed to upload file to storage',
        details: uploadError?.message
      });return;
    }

    // Create document record in database
    const document = await prisma.auditDocument.create({
      data: {
        auditId,
        title,
        description,
        documentType,
        fileUrl: url,
        filePath: path,
        uploadedById: req.user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await createActivityLog({
      userId: req.user.id,
      action: 'AUDIT_DOCUMENT_UPLOADED',
      details: `Uploaded document: ${document.title} for audit: ${audit.name}`,
    });

     res.status(201).json({
      message: 'Audit document uploaded successfully',
      document,
    });return;
  } catch (error) {
     handleApiError(error, res);return;
  }
};

// Get all documents for an audit
export const getAuditDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
       res.status(404).json({ error: 'Audit not found' });return;
    }

    const documents = await prisma.auditDocument.findMany({
      where: { auditId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

     res.status(200).json({
      count: documents.length,
      documents,
    });return;
  } catch (error) {
     handleApiError(error, res);return;
  }
};

// Create pre-audit checklist
export const createPreAuditChecklist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = validatePreAuditChecklist(req.body);
    if (error) {
       res.status(400).json({ error: error.details[0].message });return;
    }

    const { auditId, items } = req.body;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
       res.status(404).json({ error: 'Audit not found' });return;
    }

    if (!req.user || !req.user.id) {
       res.status(401).json({ error: 'Unauthorized: User not found' });return;
    }

    // Create checklist items in transaction
    const checklistItems = await prisma.$transaction(
      items.map((item: any) => 
        prisma.preAuditChecklistItem.create({
          data: {
            auditId,
            description: item.description,
            isCompleted: item.isCompleted || false,
            comments: item.comments,
            responsibleId: item.responsibleId,
            dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
            createdById: req.user!.id,
          },
        })
      )
    );

    // Log activity
    await createActivityLog({
      userId: req.user.id,
      action: 'PRE_AUDIT_CHECKLIST_CREATED',
      details: `Created pre-audit checklist with ${items.length} items for audit: ${audit.name}`,
    });

     res.status(201).json({
      message: 'Pre-audit checklist created successfully',
      items: checklistItems,
    });return;
  } catch (error) {
     handleApiError(error, res);return;
  }
};

// Get pre-audit checklist
export const getPreAuditChecklist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
       res.status(404).json({ error: 'Audit not found' });return;
    }

    const checklistItems = await prisma.preAuditChecklistItem.findMany({
      where: { auditId },
      include: {
        responsible: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

     res.status(200).json({
      count: checklistItems.length,
      items: checklistItems,
    });return;
  } catch (error) {
     handleApiError(error, res);return;
  }
};

// Update checklist item status
export const updateChecklistItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isCompleted, comments } = req.body;

    // Check if checklist item exists
    const existingItem = await prisma.preAuditChecklistItem.findUnique({
      where: { id },
      include: {
        audit: true,
      },
    });

    if (!existingItem) {
       res.status(404).json({ error: 'Checklist item not found' });return;
    }

    // Update checklist item
    const updatedItem = await prisma.preAuditChecklistItem.update({
      where: { id },
      data: {
        isCompleted,
        comments,
        completedAt: isCompleted ? new Date() : null,
      },
      include: {
        responsible: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    if (!req.user || !req.user.id) {
       res.status(401).json({ error: 'Unauthorized: User not found' });return;
    }
    await createActivityLog({
      userId: req.user.id,
      action: 'CHECKLIST_ITEM_UPDATED',
      details: `Updated checklist item for audit: ${existingItem.audit.name}`,
    });

     res.status(200).json({
      message: 'Checklist item updated successfully',
      item: updatedItem,
    });return;
  } catch (error) {
     handleApiError(error, res);return;
  }
};

// Get previous audit corrective actions
export const getPreviousAuditActions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        department: true,
      },
    });

    if (!audit) {
       res.status(404).json({ error: 'Audit not found' });return;
    }

    // Find previous audits of the same type and department (if applicable)
    const filters: any = {
      auditType: audit.auditType,
      id: { not: auditId },
      createdAt: { lt: audit.createdAt },
    };

    if (audit.departmentId) {
      filters.departmentId = audit.departmentId;
    }

    // Get previous audits
    const previousAudits = await prisma.audit.findMany({
      where: filters,
      orderBy: {
        createdAt: 'desc',
      },
      take: 5, // Limit to most recent 5 previous audits
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    // Get all corrective actions from these audits
    const previousAuditIds = previousAudits.map(a => a.id);

    const previousActions = await prisma.correctiveAction.findMany({
      where: {
        auditId: { in: previousAuditIds },
      },
      include: {
        audit: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        finding: {
          select: {
            id: true,
            title: true,
            findingType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

     res.status(200).json({
      previousAudits,
      previousActions,
    });return;
  } catch (error) {
     handleApiError(error, res);return;
  }
};

// Controller function for deleting an audit document
export const deleteAuditDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auditId, documentId } = req.params;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    // Check if document exists and belongs to this audit
    const document = await prisma.auditDocument.findFirst({
      where: { 
        id: documentId,
        auditId: auditId
      },
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found or does not belong to this audit' });
      return;
    }

    // Check user authorization
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    // Optional: Check if user has permission to delete this document
    // For example, only allow the document uploader or admin to delete
     const canDelete = document.uploadedById === req.user.id || req.user.role === 'ADMIN';
     if (!canDelete) {
       res.status(403).json({ error: 'Forbidden: You do not have permission to delete this document' });
      return;
    }

    // Delete file from Supabase storage if there's a file path
    if (document.filePath) {
      try {
        // Import the deleteFileFromSupabase function or use appropriate method
        // This function should be implemented in your supabase service
        const { error: deleteError } = await deleteFileFromSupabase(document.filePath);
        
        if (deleteError) {
          console.error('Error deleting file from storage:', deleteError);
          // Continue with database deletion even if storage deletion fails
        }
      } catch (storageError) {
        console.error('Failed to delete file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the document record from the database
    await prisma.auditDocument.delete({
      where: { id: documentId },
    });

    // Log activity
    await createActivityLog({
      userId: req.user.id,
      action: 'AUDIT_DOCUMENT_DELETED',
      details: `Deleted document: ${document.title} from audit: ${audit.name}`,
    });

    res.status(200).json({
      message: 'Audit document deleted successfully',
      documentId
    });
    return;
  } catch (error) {
    handleApiError(error, res);
    return;
  }
};