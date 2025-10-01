export interface RMQualityParameter {
    id?: string;
    parameter: string;
    standard: string;
    result: string;
}

export interface RMQualityReport {
    id: string;
    rawMaterialName: string;
    variety: string;
    supplier: string;
    dateOfReport: string;
    grn: string;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    parameters: RMQualityParameter[];
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
}

export interface CreateRMQualityReportData {
    rawMaterialName: string;
    variety: string;
    supplier: string;
    grn: string;
    parameters: RMQualityParameter[];
}