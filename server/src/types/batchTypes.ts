import { BatchStatus, SampleAnalysisStatus } from '../generated/prisma';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// BatchCreateRequest type
export interface BatchCreateRequest {
  batchNumber: string;
  productId: string;
  dateOfProduction: string;
  bestBeforeDate: string;
  sampleAnalysisStarted?: string;
  sampleAnalysisCompleted?: string;
  sampleAnalysisStatus?: SampleAnalysisStatus;
  standardIds?: string[];
  methodologyIds?: string[];
  unitIds?: string[];
  parameterValues: BatchParameterValueInput[];
  productName: string;
  productCode: string; 
}

// Updated BatchUpdateRequest type with deleteOtherParameters flag
export interface BatchUpdateRequest extends Partial<BatchCreateRequest> {
  deleteOtherParameters?: boolean; // Flag to determine if parameters not included in the update should be deleted
}

// BatchParameterValueInput type for creating/updating parameter values
export interface BatchParameterValueInput {
  parameterId: string;
  value: string;
  unitId?: string;
  methodologyId?: string;
}

// Request type for rejecting a batch
export interface BatchRejectRequest {
  rejectionRemarks: string;
}

// Filter type for batch queries
export interface BatchFilter {
  status?: BatchStatus;
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
  batchNumber?: string;
}