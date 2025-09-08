import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

function parseDateField(val: any) {
    if (!val || typeof val !== 'string' || val.trim() === '') return null;
    // Accept only valid date strings
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Save or update a batch draft.
 * Allows partial/incomplete data.
 */
export const saveDraftBatch = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get makerId from authenticated user
        const makerId = req.user?.id;
        if (!makerId) {
            res.status(401).json({ error: 'Unauthorized: No user found' });
            return;
        }

        const { id, formData = {}, parameterValues = [], newProductName = '', ...rest } = req.body;

        // Prepare draft data, only including fields that are present
        const draftData: any = {
            ...formData,
            makerId,
            parameterValues: parameterValues && parameterValues.length > 0 ? parameterValues : undefined,
            newProductName: newProductName || undefined,
            status: 'DRAFT',
            updatedAt: new Date(),
            ...rest,
        };

        // Remove empty string fields and convert them to undefined (so Prisma will store null)
        Object.keys(draftData).forEach((key) => {
            if (draftData[key] === '') draftData[key] = undefined;
        });

        // Convert date fields to Date or null
        draftData.dateOfProduction = parseDateField(draftData.dateOfProduction);
        draftData.bestBeforeDate = parseDateField(draftData.bestBeforeDate);
        draftData.sampleAnalysisStarted = parseDateField(draftData.sampleAnalysisStarted);
        draftData.sampleAnalysisCompleted = parseDateField(draftData.sampleAnalysisCompleted);

        const providedId = typeof id === 'string' && id.trim() !== '' ? id : undefined;
        const idToUse = providedId ?? uuidv4();

        let draft;
        if (providedId) {
            draft = await prisma.batchDraft.upsert({
                where: { id: providedId },
                update: { ...draftData },
                create: { ...draftData, id: providedId },
            });
        } else {
            draft = await prisma.batchDraft.create({
                data: { ...draftData, id: idToUse },
            });
        }
        res.status(200).json(draft);
    } catch (error) {
        console.error('Error saving draft batch:', error);
        res.status(500).json({ error: 'Failed to save draft' });
    }
};

/**
 * Get a batch draft by ID.
 */
export const getDraftBatch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const draft = await prisma.batchDraft.findUnique({ where: { id } });
        if (!draft) {
            res.status(404).json({ error: 'Draft not found' });
            return;
        }
        res.status(200).json(draft);
    } catch (error) {
        console.error('Error loading draft batch:', error);
        res.status(500).json({ error: 'Failed to load draft' });
    }
};

export const getLatestDraftForUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const makerId = req.user?.id;
        if (!makerId) {
            res.status(401).json({ error: 'Unauthorized: No user found' });
            return;
        }
        const draft = await prisma.batchDraft.findFirst({
            where: { makerId },
            orderBy: { updatedAt: 'desc' },
        });
        if (!draft) {
            res.status(404).json({ error: 'No draft found' });
            return;
        }
        res.status(200).json(draft);
    } catch (error) {
        console.error('Error loading latest draft:', error);
        res.status(500).json({ error: 'Failed to load draft' });
    }
};