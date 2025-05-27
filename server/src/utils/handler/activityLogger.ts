import { PrismaClient } from '../../generated/prisma';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface ActivityLogParams {
  userId: string;
  action: string;
  details?: string;
  batchId?: string;
}

export const createActivityLog = async (params: ActivityLogParams) => {
  try {
    const { userId, action, details, batchId } = params;

    await prisma.activityLog.create({
      data: {
        id: uuidv4(),
        userId,
        action,
        details,
        batchId,
      },
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Don't throw the error to prevent disrupting the main flow
  }
};