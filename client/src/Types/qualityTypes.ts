export interface RMQualityParameter {
    id?: string;
    parameter: string;
    standard: string;
    result: string;
}

export interface RMQualityReport {
    id: string;
    reportNumber: string | null;
    rawMaterialName: string;
    variety: string;
    supplier: string;
    purchaseOrderId: string | null;
    purchaseOrderItemId: string | null;
    dateOfReport: string;
    grn: string | null;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    parameters: RMQualityParameter[];
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    grn_entry?: {
        id: string;
        grnNumber: string;
    } | null;
}

export interface CreateRMQualityReportData {
    rawMaterialName: string;
    variety: string;
    supplier: string;
    purchaseOrderId?: string;
    purchaseOrderItemId?: string;
    parameters: RMQualityParameter[];
}