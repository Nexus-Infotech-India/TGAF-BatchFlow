import { useEffect, useCallback } from 'react';
import axios from 'axios';

interface UseAutoSaveProps {
    saveUrl: string;
    getUrl?: string;
    data: any;
    isSuccess: boolean;
    authToken: string;
    draftId?: string | null;
    onDraftIdChange?: (id: string) => void;
}

export const useAutoSave = ({
    saveUrl,
    getUrl,
    data,
    isSuccess,
    authToken,
    draftId,
    onDraftIdChange,
}: UseAutoSaveProps) => {
    // Debounced save function
    const debouncedSave = useCallback(
        debounce(async (data: any) => {
            try {
                // Prevent autosave when all fields are empty and no draftId yet.
                const formData = data?.formData ?? null;
                const parameterValues = data?.parameterValues ?? [];
                const newProductName = (data?.newProductName ?? '').toString();

                const noFormFilled =
                    (!formData ||
                        (
                            (formData.batchNumber ?? '').toString().trim() === '' &&
                            (formData.productId ?? '').toString().trim() === '' &&
                            (formData.dateOfProduction ?? '').toString().trim() === '' &&
                            (formData.bestBeforeDate ?? '').toString().trim() === '' &&
                            (formData.sampleAnalysisStarted ?? '').toString().trim() === '' &&
                            (formData.sampleAnalysisCompleted ?? '').toString().trim() === ''
                        )
                    ) &&
                    parameterValues.length === 0 &&
                    newProductName.trim() === '';

                // If nothing meaningful to save and there's no existing draft id, skip saving.
                if (noFormFilled && (!draftId || draftId.trim() === '')) {
                    return;
                }

                const payload = draftId && draftId.trim() !== '' ? { id: draftId, ...data } : { ...data };
                const response = await axios.post(
                    saveUrl,
                    payload,
                    { headers: { Authorization: `Bearer ${authToken}` } }
                );
                if (!draftId && onDraftIdChange) {
                    onDraftIdChange(response.data.id);
                }
            } catch (error) {
                console.error('Error saving draft:', error);
            }
        }, 2000),  // Save after 2 seconds of inactivity
        [saveUrl, draftId, authToken, onDraftIdChange]
    );

    // Auto-save on data changes
    useEffect(() => {
        if (data) {
            debouncedSave(data);
        }
    }, [data, debouncedSave]);

    // Clear draft on success
    useEffect(() => {
        if (isSuccess && draftId) {
            // Optionally, you can call an API to delete or update the draft status here
            // For now, just reset the draftId
            if (onDraftIdChange) {
                onDraftIdChange('');
            }
        }
    }, [isSuccess, draftId, onDraftIdChange]);

    // Optional: Load draft if getUrl is provided and draftId exists
    const loadDraft = useCallback(async () => {
        if (getUrl && draftId) {
            try {
                const response = await axios.get(getUrl, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                return response.data;
            } catch (error) {
                console.error('Error loading draft:', error);
                return null;
            }
        }
        return null;
    }, [getUrl, draftId, authToken]);

    // Debounce utility function
    function debounce(func: Function, wait: number) {
        let timeout: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(null, args), wait);
        };
    }
    return { loadDraft };
};