import { PrismaClient, AuditStatus } from '../generated/prisma';
import { createActivityLog } from '../utils/handler/activityLogger';

const prisma = new PrismaClient();

/**
 * Updates audit statuses based on date criteria:
 * - PLANNED to IN_PROGRESS when current date >= startDate
 * - IN_PROGRESS to COMPLETED when current date > endDate
 */
export const updateAuditStatuses = async () => {
  const currentDate = new Date();
  let updatedAudits = 0;
  
  try {
    // First, find or create a system user for logging
    let systemUser;
    try {
      // Try to find an existing admin/system user
      systemUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'system@example.com' },
            { email: 'admin@example.com' }
          ],
        }
      });
      
      if (!systemUser) {
        // Find any user who has admin privileges
        systemUser = await prisma.user.findFirst({
          where: {
            Role: {
              name: 'Admin'
            }
          }
        });
      }
      
      // If still no suitable user, use the first user in the system
      if (!systemUser) {
        systemUser = await prisma.user.findFirst();
      }
      
      if (!systemUser) {
        console.error('Unable to find any user for activity logging');
        // Continue without logging
      }
    } catch (error) {
      console.error('Error finding system user for logging:', error);
      // Continue without logging
    }
    
    // Process audits in small batches to minimize memory usage and database load
    const batchSize = 50;
    
    // 1. Update PLANNED audits to IN_PROGRESS
    const plannedAudits = await prisma.audit.findMany({
      where: {
        status: 'PLANNED',
        startDate: {
          lte: currentDate // Start date has arrived or passed
        }
      },
      take: batchSize,
    });
    
    if (plannedAudits.length > 0) {
      console.log(`Found ${plannedAudits.length} PLANNED audits to update to IN_PROGRESS`);
      
      for (const audit of plannedAudits) {
        await prisma.audit.update({
          where: { id: audit.id },
          data: { status: 'IN_PROGRESS' }
        });
        
        // Log the activity if we have a valid system user
        if (systemUser) {
          try {
            await createActivityLog({
              userId: systemUser.id,
              action: 'AUDIT_STATUS_CHANGED',
              details: `Automatically updated audit "${audit.name}" status from PLANNED to IN_PROGRESS as start date (${audit.startDate.toISOString().split('T')[0]}) has arrived.`
            });
          } catch (logError) {
            console.error('Error creating activity log:', logError);
            // Continue processing other audits even if logging fails
          }
        }
        
        updatedAudits++;
      }
    }
    
    // 2. Update IN_PROGRESS audits to COMPLETED
    const inProgressAudits = await prisma.audit.findMany({
      where: {
        status: 'IN_PROGRESS',
        endDate: {
          lt: currentDate // End date has passed
        }
      },
      take: batchSize,
    });
    
    if (inProgressAudits.length > 0) {
      console.log(`Found ${inProgressAudits.length} IN_PROGRESS audits to update to COMPLETED`);
      
      for (const audit of inProgressAudits) {
        await prisma.audit.update({
          where: { id: audit.id },
          data: { status: 'COMPLETED' }
        });
        
        // Log the activity if we have a valid system user
        if (systemUser) {
          try {
            await createActivityLog({
              userId: systemUser.id,
              action: 'AUDIT_STATUS_CHANGED',
              details: `Automatically updated audit "${audit.name}" status from IN_PROGRESS to COMPLETED as end date (${audit.endDate?.toISOString().split('T')[0]}) has passed.`
            });
          } catch (logError) {
            console.error('Error creating activity log:', logError);
            // Continue processing other audits even if logging fails
          }
        }
        
        updatedAudits++;
      }
    }
    
    console.log(`Audit status update job completed successfully. Updated ${updatedAudits} audits.`);
    return { success: true, updatedAudits };
  } catch (error) {
    console.error('Error updating audit statuses:', error);
    return { success: false, error };
  }
}