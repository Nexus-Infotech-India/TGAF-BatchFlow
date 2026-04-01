import { Router } from 'express';
import { CleaningJobController } from '../controllers/rawmaterial/cleaning.controller';
import { CleaningGrnController } from '../controllers/rawmaterial/cleaningGrn.controller';
import { ProcessingJobController } from '../controllers/rawmaterial/processing.controller';
import { RawMaterialProductController } from '../controllers/rawmaterial/product.controller';
import { PurchaseOrderController } from '../controllers/rawmaterial/purchase.controller';
import { StockEntryController } from '../controllers/rawmaterial/stock.controller';
import { UnfinishedStockController } from '../controllers/rawmaterial/unfinished.controller';
import { VendorController } from '../controllers/rawmaterial/vendor.controller';
import { WarehouseController } from '../controllers/rawmaterial/warehouse.controller';
import { TransactionLogController } from '../controllers/rawmaterial/log.controller';
import { authenticate } from '../middlewares/authMiddleware';
import { getPurchaseOrdersByProduct, getPurchaseOrderTimeline } from '../controllers/rawmaterial/time.controller';
import { DashboardController } from '../controllers/rawmaterial/Dashboard.controller';
import { RMQualityController } from '../controllers/rawmaterial/quality.controller';
import { RMQualityMailController } from '../controllers/rawmaterial/qualityMail.controller';
import { RMQualityMailFilteredController } from '../controllers/rawmaterial/qualityMailFiltered.controller';
import { RMQualityExportFilteredController } from '../controllers/rawmaterial/qualityExportFiltered.controller';
import { sendPurchaseOrderMail } from '../controllers/rawmaterial/sendPurchaseOrderMail.controller';
import { GRNController } from '../controllers/rawmaterial/grn.controller';
import { BOMController } from '../controllers/rawmaterial/bom.controller';
import { LocationController } from '../controllers/rawmaterial/location.controller';
import { TransferController } from '../controllers/rawmaterial/transfer.controller';
import { ProductionController } from '../controllers/rawmaterial/production.controller';
import { GrindingDispatchController } from '../controllers/rawmaterial/grindingDispatch.controller';
import { FGBatchController } from '../controllers/rawmaterial/fgBatch.controller';

const router = Router();

// Apply authentication middleware to all routes below
router.use(authenticate);

// Cleaning Jobs
router.post('/cleaning', CleaningJobController.createCleaningJob);
router.get('/cleaning', CleaningJobController.getCleaningJobs);
router.get('/cleaning/:id', CleaningJobController.getCleaningJobById);
router.put('/cleaning/:id', CleaningJobController.updateCleaningJob);

// Processing Jobs
router.post('/processing', ProcessingJobController.createProcessingJob);
router.post('/processing/batch', ProcessingJobController.createProcessingBatch);
router.get('/processing/available-lots', ProcessingJobController.getAvailableLots);
router.get('/processing', ProcessingJobController.getProcessingJobs);
router.get('/processing/:id', ProcessingJobController.getProcessingJobById);
router.put('/processing/:id', ProcessingJobController.updateProcessingJob);

// Raw Material Products
router.post('/product', RawMaterialProductController.createRawMaterialProduct);
router.get('/product', RawMaterialProductController.getRawMaterialProducts);
router.get('/product/:id', RawMaterialProductController.getRawMaterialProductById);
router.put('/product/:id', RawMaterialProductController.updateRawMaterialProduct);
router.delete('/product/:id', RawMaterialProductController.deleteRawMaterialProduct);

// Purchase Orders
router.post('/purchase', PurchaseOrderController.createPurchaseOrder);
router.get('/purchase', PurchaseOrderController.getPurchaseOrders);
router.get('/purchase/send-mail', sendPurchaseOrderMail);
router.get('/purchase/received/raw-materials', PurchaseOrderController.getReceivedRawMaterials);
router.get('/purchase/received/vendors', PurchaseOrderController.getVendorsFromReceivedOrders);
router.put('/purchase/item/:itemId', PurchaseOrderController.updatePurchaseOrderItem);
router.get('/purchase/item/:itemId/receivals', PurchaseOrderController.getReceivalHistory);
router.get('/purchase/:id', PurchaseOrderController.getPurchaseOrderById);
router.put('/purchase/:id', PurchaseOrderController.updatePurchaseOrder);
router.delete('/purchase/:id', PurchaseOrderController.deletePurchaseOrder);

// Stock Entries
router.post('/stock', StockEntryController.createStockEntry);
router.get('/stock', StockEntryController.getStockEntries);
router.get('/stock/:id', StockEntryController.getStockEntryById);
router.put('/stock/:id', StockEntryController.updateStockEntry);

// Unfinished Stock
router.post('/unfinished', UnfinishedStockController.createUnfinishedStock);
router.get('/unfinished', UnfinishedStockController.getUnfinishedStocks);
router.get('/unfinished/:id', UnfinishedStockController.getUnfinishedStockById);
router.put('/unfinished/:id', UnfinishedStockController.updateUnfinishedStock);

// Vendors
router.post('/vendor', VendorController.createVendor);
router.get('/vendor', VendorController.getVendors);
router.get('/vendor/:id', VendorController.getVendorById);
router.put('/vendor/:id', VendorController.updateVendor);
router.patch('/vendor/:id/status', VendorController.setVendorStatus);

// Warehouses
router.post('/warehouse', WarehouseController.createWarehouse);
router.get('/warehouse', WarehouseController.getWarehouses);
router.get('/warehouse/:id', WarehouseController.getWarehouseById);
router.put('/warehouse/:id', WarehouseController.updateWarehouse);
router.delete('/warehouse/:id', WarehouseController.deleteWarehouse);

// Locations
router.post('/location', LocationController.createLocation);
router.get('/location', LocationController.getLocations);
router.get('/location/:id', LocationController.getLocationById);
router.put('/location/:id', LocationController.updateLocation);
router.patch('/location/:id/status', LocationController.setLocationStatus);

// Material Transfers
router.post('/transfers', TransferController.createTransfer);
router.get('/transfers', TransferController.getTransfers);
router.post('/transfers/outbound', TransferController.createOutboundTransfer);
router.get('/transfers/:id', TransferController.getTransferById);
router.put('/transfers/:id/accept', TransferController.acceptTransfer);
router.put('/transfers/:id/reject', TransferController.rejectTransfer);

// Production Posting
router.get('/production/consumption-data', ProductionController.getConsumptionData);
router.post('/production/post', ProductionController.postProduction);
router.get('/production/postings', ProductionController.getPostings);
router.get('/production/completed-for-outbound', ProductionController.getCompletedForOutbound);
router.get('/production/postings/:id', ProductionController.getPostingById);
router.put('/production/postings/:id/complete', ProductionController.completeProduction);

router.get('/stock', StockEntryController.getCurrentStockDistribution);
router.get('/purchase-order-items', PurchaseOrderController.getAllPurchaseOrderItems);
router.get('/transaction-logs', TransactionLogController.getAllTransactionLogs);
router.get('/cleaned-materials', CleaningJobController.getCleanedMaterials);

router.get('/purchase', getPurchaseOrdersByProduct);
router.get('/purchase/:id/timeline', getPurchaseOrderTimeline);

router.get('/dashboard/total-stock', DashboardController.getTotalRawMaterialStock);
router.get('/dashboard/pending-pos', DashboardController.getPendingPOCount);
router.get('/dashboard/under-cleaning', DashboardController.getStockUnderCleaning);
router.get('/dashboard/in-processing', DashboardController.getStockInProcessing);
router.get('/dashboard/low-stock', DashboardController.getLowStockAlerts);
router.get('/dashboard/waste-stock', DashboardController.getWasteStock);
router.get('/dashboard/total-vendors', DashboardController.getTotalVendors);
router.get('/dashboard/total-purchase-orders', DashboardController.getTotalPurchaseOrders);
router.get('/dashboard/recent-transactions', DashboardController.getRecentTransactions);
router.get('/dashboard/product-wise-waste', DashboardController.getProductWiseWasteStock);
router.get('/dashboard/stock-distribution', DashboardController.getStockDistributionByWarehouse);
router.get('/dashboard/product-wise-conversion', DashboardController.getProductWiseConversionRatio);


// RM Quality Reports
router.post('/quality-report', RMQualityController.createQualityReport);
router.get('/quality-report', RMQualityController.getQualityReports);
router.get('/quality-report/without-grn', RMQualityController.getReportsWithoutGRN);
router.get('/quality-report/for-grn-page', RMQualityController.getReportsForGRNPage);
router.get('/quality-report/export/all', RMQualityController.exportAllQualityReports);
router.get('/quality-report/mail/all', RMQualityMailController.mailAllQualityReports);
router.post('/quality-report/mail/filtered', RMQualityMailFilteredController.mailFilteredQualityReports);
router.post('/quality-report/export/filtered', RMQualityExportFilteredController.exportFilteredQualityReports);
router.get('/quality-report/:id', RMQualityController.getQualityReportById);
router.put('/quality-report/:id', RMQualityController.updateQualityReport);
router.delete('/quality-report/:id', RMQualityController.deleteQualityReport);
router.get('/quality-report/:id/export', RMQualityController.exportQualityReport);

// GRN by PO
router.post('/grn', GRNController.createGRN);
router.post('/grn/from-report', GRNController.generateGRNForReport);
router.get('/grn', GRNController.getGRNs);
router.get('/grn/received-pos', GRNController.getReceivedPOs);
router.get('/grn/po/:poId', GRNController.getGRNsByPO);
router.get('/grn/:id', GRNController.getGRNById);
router.delete('/grn/:id', GRNController.deleteGRN);

// GRN-wise Cleaning
router.get('/cleaning-grn', CleaningGrnController.getGRNsForCleaning);
router.get('/cleaning-grn/lots', CleaningGrnController.getCleaningLots);
router.get('/cleaning-grn/:grnNumber', CleaningGrnController.getGRNMaterialsByGrnNumber);
router.post('/cleaning-grn/transfer', CleaningGrnController.createGRNCleaningTransfer);
router.put('/cleaning-grn/finish/:id', CleaningGrnController.finishCleaning);

// Bill of Material (BOM)
router.post('/bom', BOMController.createBOM);
router.get('/bom', BOMController.getBOMs);
router.get('/bom/by-sfg/:productId', BOMController.getBOMBySFG);
router.get('/bom/:id', BOMController.getBOMById);
router.put('/bom/:id', BOMController.updateBOM);
router.delete('/bom/:id', BOMController.deleteBOM);

// Grinding Dispatch (Transfer with Approval)
router.post('/grinding/dispatch', GrindingDispatchController.createDispatch);
router.get('/grinding/dispatches', GrindingDispatchController.getDispatches);
router.get('/grinding/dispatch/:id', GrindingDispatchController.getDispatchById);
router.put('/grinding/dispatch/:id/accept', GrindingDispatchController.acceptDispatch);
router.put('/grinding/dispatch/:id/reject', GrindingDispatchController.rejectDispatch);

// FG Batch (Finished Good Batch Production)
router.get('/fg-batch/boms', FGBatchController.getFGBOMs);
router.get('/fg-batch/bom-items', FGBatchController.getFGBOMItems);
router.post('/fg-batch/create', FGBatchController.createFGBatch);
router.get('/fg-batch/list', FGBatchController.getFGBatches);
router.get('/fg-batch/:id', FGBatchController.getFGBatchById);
router.put('/fg-batch/:id/accept', FGBatchController.acceptFGBatch);
router.put('/fg-batch/:id/reject', FGBatchController.rejectFGBatch);

export default router;