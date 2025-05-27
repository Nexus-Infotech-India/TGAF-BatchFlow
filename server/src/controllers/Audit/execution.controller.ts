import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { validateFinding } from '../../utils/validator';
import { handleApiError } from '../../utils/handler/errorHandler';
import { createActivityLog } from '../../utils/handler/activityLogger';
import { uploadFileToSupabase } from '../../service/supabase';

const prisma = new PrismaClient();

// Start the execution phase of an audit
export const startExecutionPhase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    // Update audit status to in progress
    const updatedAudit = await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'IN_PROGRESS',
      },
    });

    // Log activity
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    
    await createActivityLog({
      userId: req.user.id,
      action: 'EXECUTION_PHASE_STARTED',
      details: `Started execution phase for audit: ${audit.name}`,
    });

    res.status(200).json({
      message: 'Audit execution phase started successfully',
      audit: updatedAudit,
    });
    return;
  } catch (error) {
    handleApiError(error, res);
    return;
  }
};

// Create a finding during audit execution
export const createFinding = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = validateFinding(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { 
      auditId, 
      title, 
      description, 
      findingType, 
      status, 
      priority,
      dueDate, 
      assignedToId,
      evidence 
    } = req.body;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    // Handle file upload for evidence if available
    let evidenceUrl = evidence;
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      
      const { url, error: uploadError } = await uploadFileToSupabase(
        fileBuffer,
        fileName,
        'audit-evidences',
        `audit-${auditId}/finding-evidence`
      );

      if (uploadError || !url) {
        res.status(500).json({ 
          error: 'Failed to upload evidence file to storage',
          details: uploadError?.message
        });
        return;
      }

      evidenceUrl = url;
    }

    // Create the finding
    const finding = await prisma.finding.create({
      data: {
        auditId,
        title,
        description,
        findingType,
        status: status || 'OPEN',
        priority: priority || 'MEDIUM', 
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedToId,
        evidence: evidenceUrl,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    
    await createActivityLog({
      userId: req.user.id,
      action: 'FINDING_CREATED',
      details: `Created finding: ${finding.title} (${finding.findingType}) for audit: ${audit.name}`,
    });

    // If a user is assigned, create a notification
    if (assignedToId) {
      await prisma.auditNotification.create({
        data: {
          auditId,
          userId: assignedToId,
          title: `New Finding Assigned: ${finding.title}`,
          message: `You have been assigned to address a ${findingType.toLowerCase()} finding in audit: ${audit.name}`,
          isRead: false,
          sentAt: new Date(),
        },
      });
    }

    res.status(201).json({
      message: 'Finding created successfully',
      finding,
    });
    return;
  } catch (error) {
    handleApiError(error, res);
    return;
  }
};

// Get all findings for an audit
export const getAuditFindings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;
    const { type, status } = req.query;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    // Build filters
    const filters: any = { auditId };
    if (type) filters.findingType = type;
    if (status) filters.status = status;

    const findings = await prisma.finding.findMany({
      where: filters,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        actions: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      count: findings.length,
      findings,
    });
    return;
  } catch (error) {
    handleApiError(error, res);
    return;
  }
};

// Get a single finding by ID
export const getFindingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const finding = await prisma.finding.findUnique({
      where: { id },
      include: {
        audit: {
          select: {
            id: true,
            name: true,
            auditType: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        actions: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!finding) {
      res.status(404).json({ error: 'Finding not found' });
      return;
    }

    res.status(200).json(finding);
    return;
  } catch (error) {
    handleApiError(error, res);
    return;
  }
};

// Update a finding
export const updateFinding = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      findingType,
      status,
      priority, 
      dueDate,
      assignedToId,
      evidence,
    } = req.body;

    // Check if finding exists
    const existingFinding = await prisma.finding.findUnique({
      where: { id },
      include: { audit: true },
    });

    if (!existingFinding) {
      res.status(404).json({ error: 'Finding not found' });
      return;
    }

    // Handle file upload for new evidence if available
    let evidenceUrl = evidence;
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      
      const { url, error: uploadError } = await uploadFileToSupabase(
        fileBuffer,
        fileName,
        'audit-evidences',
        `audit-${existingFinding.auditId}/finding-evidence`
      );

      if (uploadError || !url) {
        res.status(500).json({ 
          error: 'Failed to upload evidence file to storage',
          details: uploadError?.message
        });
        return;
      }

      evidenceUrl = url;
    }

    // Check if status is being changed to CLOSED
    const isClosed = status === 'CLOSED' && existingFinding.status !== 'CLOSED';

    // Update the finding
    const updatedFinding = await prisma.finding.update({
      where: { id },
      data: {
        title,
        description,
        findingType,
        status,
        priority, 
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId,
        evidence: evidenceUrl,
        // If status is changing to CLOSED, set closedAt date
        closedAt: isClosed ? new Date() : existingFinding.closedAt,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    
    await createActivityLog({
      userId: req.user.id,
      action: 'FINDING_UPDATED',
      details: `Updated finding: ${updatedFinding.title} for audit: ${existingFinding.audit.name}`,
    });

    // If assignee changed, notify new assignee
    if (assignedToId && assignedToId !== existingFinding.assignedToId) {
      await prisma.auditNotification.create({
        data: {
          auditId: existingFinding.auditId,
          userId: assignedToId,
          title: `Finding Assigned: ${updatedFinding.title}`,
          message: `You have been assigned to address a ${updatedFinding.findingType.toLowerCase()} finding in audit: ${existingFinding.audit.name}`,
          isRead: false,
          sentAt: new Date(),
        },
      });
    }

    res.status(200).json({
      message: 'Finding updated successfully',
      finding: updatedFinding,
    });
    return;
  } catch (error) {
    handleApiError(error, res);
    return;
  }
};

// Create an inspection area checklist
export const createInspectionChecklist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;
    const { areaName, items } = req.body;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    // Create inspection checklist items in a transaction
    const checklistItems = await prisma.$transaction(
      items.map((item: any) => 
        prisma.auditInspectionItem.create({
          data: {
            auditId,
            areaName,
            itemName: item.itemName,
            description: item.description,
            standardReference: item.standardReference || null,
            
            // ✅ Inspection results - set defaults until actually inspected
            isCompliant: null,           // Not inspected yet
            comments: null,              // No comments yet
            evidence: null,              // No evidence yet  
            inspectedById: null,         // Not inspected by anyone yet       // Not inspected yet
          },
        })
      )
    );

    // Log activity
    await createActivityLog({
      userId: req.user.id,
      action: 'INSPECTION_CHECKLIST_CREATED',
      details: `Created inspection checklist for ${areaName} with ${items.length} items in audit: ${audit.name}`,
    });

    res.status(201).json({
      message: 'Inspection checklist created successfully',
      areaName,
      items: checklistItems,
    });
    return;
  } catch (error) {
    handleApiError(error, res);
    return;
  }
};


export const getInspectionChecklists = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    // Group items by area
    const items = await prisma.auditInspectionItem.findMany({
      where: { auditId },
      include: {
        inspectedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { areaName: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Group items by area
    const areas: { [key: string]: any[] } = {};
    items.forEach(item => {
      if (!areas[item.areaName]) {
        areas[item.areaName] = [];
      }
      areas[item.areaName].push(item);
    });

    // Convert to array of areas
    const checklists = Object.keys(areas).map(areaName => ({
      areaName,
      items: areas[areaName],
      totalItems: areas[areaName].length,
      compliantItems: areas[areaName].filter(item => item.isCompliant).length,
    }));

    res.status(200).json({
      count: checklists.length,
      checklists,
    });
    return;
  } catch (error) {
    handleApiError(error, res);
    return;
  }
};

// Complete the execution phase
export const completeExecutionPhase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;
    const { summary } = req.body;

    // Check if audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    // Get findings summary
    const findingsCount = await prisma.finding.groupBy({
      by: ['findingType'],
      where: { auditId },
      _count: true,
    });

    // Update audit with completion info
    const updatedAudit = await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'COMPLETED',
        summary,
      },
    });

    // Log activity
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    
    await createActivityLog({
      userId: req.user.id,
      action: 'EXECUTION_PHASE_COMPLETED',
      details: `Completed execution phase for audit: ${audit.name}`,
    });

    res.status(200).json({
      message: 'Audit execution phase completed successfully',
      audit: updatedAudit,
      findingsSummary: findingsCount,
    });
    return;
  } catch (error) {
    handleApiError(error, res);
    return;
  }
};

export const updateInspectionItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { isCompliant, comments, evidence } = req.body;

    // Check if inspection item exists
    const existingItem = await prisma.auditInspectionItem.findUnique({
      where: { id: itemId },
      include: { audit: true },
    });

    if (!existingItem) {
      res.status(404).json({ error: 'Inspection item not found' });
      return;
    }

    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    // Handle evidence file upload if provided
    let evidenceUrl = evidence;
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      
      const { url, error: uploadError } = await uploadFileToSupabase(
        fileBuffer,
        fileName,
        'audit-evidences',
        `audit-${existingItem.auditId}/inspection-evidence`
      );

      if (uploadError || !url) {
        res.status(500).json({ 
          error: 'Failed to upload evidence file to storage',
          details: uploadError?.message
        });
        return;
      }

      evidenceUrl = url;
    }

     let isCompliantBoolean: boolean | null = null;
    if (isCompliant === 'true' || isCompliant === true) {
      isCompliantBoolean = true;
    } else if (isCompliant === 'false' || isCompliant === false) {
      isCompliantBoolean = false;
    }

    // Update the inspection item
    const updatedItem = await prisma.auditInspectionItem.update({
      where: { id: itemId },
      data: {
        isCompliant: isCompliantBoolean,
        comments,
        evidence: evidenceUrl,
        inspectedById: req.user.id,
        updatedAt: new Date(),
      },
      include: {
        inspectedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    await createActivityLog({
      userId: req.user.id,
      action: 'INSPECTION_ITEM_UPDATED',
      details: `Marked "${updatedItem.itemName}" as ${isCompliant ? 'compliant' : 'non-compliant'} in area: ${updatedItem.areaName} for audit: ${existingItem.audit.name}`,
    });

    res.status(200).json({
      message: 'Inspection item updated successfully',
      item: updatedItem,
      // Suggest creating finding if non-compliant
      suggestFinding: !isCompliant,
    });
    return;
  } catch (error) {
    handleApiError(error, res);
    return;
  }
};

export const getInspectionItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;

    const item = await prisma.auditInspectionItem.findUnique({
      where: { id: itemId },
      include: {
        audit: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        inspectedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!item) {
      res.status(404).json({ error: 'Inspection item not found' });
      return;
    }

    res.status(200).json(item);
    return;
  } catch (error) {
    handleApiError(error, res);
    return;
  }
};