"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cleaning_controller_1 = require("../controllers/rawmaterial/cleaning.controller");
const cleaningGrn_controller_1 = require("../controllers/rawmaterial/cleaningGrn.controller");
const processing_controller_1 = require("../controllers/rawmaterial/processing.controller");
const product_controller_1 = require("../controllers/rawmaterial/product.controller");
const purchase_controller_1 = require("../controllers/rawmaterial/purchase.controller");
const stock_controller_1 = require("../controllers/rawmaterial/stock.controller");
const unfinished_controller_1 = require("../controllers/rawmaterial/unfinished.controller");
const vendor_controller_1 = require("../controllers/rawmaterial/vendor.controller");
const warehouse_controller_1 = require("../controllers/rawmaterial/warehouse.controller");
const log_controller_1 = require("../controllers/rawmaterial/log.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const time_controller_1 = require("../controllers/rawmaterial/time.controller");
const Dashboard_controller_1 = require("../controllers/rawmaterial/Dashboard.controller");
const quality_controller_1 = require("../controllers/rawmaterial/quality.controller");
const qualityMail_controller_1 = require("../controllers/rawmaterial/qualityMail.controller");
const qualityMailFiltered_controller_1 = require("../controllers/rawmaterial/qualityMailFiltered.controller");
const qualityExportFiltered_controller_1 = require("../controllers/rawmaterial/qualityExportFiltered.controller");
const sendPurchaseOrderMail_controller_1 = require("../controllers/rawmaterial/sendPurchaseOrderMail.controller");
const grn_controller_1 = require("../controllers/rawmaterial/grn.controller");
const bom_controller_1 = require("../controllers/rawmaterial/bom.controller");
const location_controller_1 = require("../controllers/rawmaterial/location.controller");
const transfer_controller_1 = require("../controllers/rawmaterial/transfer.controller");
const production_controller_1 = require("../controllers/rawmaterial/production.controller");
const grindingDispatch_controller_1 = require("../controllers/rawmaterial/grindingDispatch.controller");
const fgBatch_controller_1 = require("../controllers/rawmaterial/fgBatch.controller");
const fgProduction_controller_1 = require("../controllers/rawmaterial/fgProduction.controller");
const fgVerification_controller_1 = require("../controllers/rawmaterial/fgVerification.controller");
const fgPackaging_controller_1 = require("../controllers/rawmaterial/fgPackaging.controller");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes below
router.use(authMiddleware_1.authenticate);
// Cleaning Jobs
router.post('/cleaning', cleaning_controller_1.CleaningJobController.createCleaningJob);
router.get('/cleaning', cleaning_controller_1.CleaningJobController.getCleaningJobs);
router.get('/cleaning/:id', cleaning_controller_1.CleaningJobController.getCleaningJobById);
router.put('/cleaning/:id', cleaning_controller_1.CleaningJobController.updateCleaningJob);
// Processing Jobs
router.post('/processing', processing_controller_1.ProcessingJobController.createProcessingJob);
router.post('/processing/batch', processing_controller_1.ProcessingJobController.createProcessingBatch);
router.get('/processing/available-lots', processing_controller_1.ProcessingJobController.getAvailableLots);
router.get('/processing', processing_controller_1.ProcessingJobController.getProcessingJobs);
router.get('/processing/:id', processing_controller_1.ProcessingJobController.getProcessingJobById);
router.put('/processing/:id', processing_controller_1.ProcessingJobController.updateProcessingJob);
// Raw Material Products
router.post('/product', product_controller_1.RawMaterialProductController.createRawMaterialProduct);
router.get('/product', product_controller_1.RawMaterialProductController.getRawMaterialProducts);
router.get('/product/:id', product_controller_1.RawMaterialProductController.getRawMaterialProductById);
router.put('/product/:id', product_controller_1.RawMaterialProductController.updateRawMaterialProduct);
router.delete('/product/:id', product_controller_1.RawMaterialProductController.deleteRawMaterialProduct);
// Purchase Orders
router.post('/purchase', purchase_controller_1.PurchaseOrderController.createPurchaseOrder);
router.get('/purchase', purchase_controller_1.PurchaseOrderController.getPurchaseOrders);
router.get('/purchase/send-mail', sendPurchaseOrderMail_controller_1.sendPurchaseOrderMail);
router.get('/purchase/received/raw-materials', purchase_controller_1.PurchaseOrderController.getReceivedRawMaterials);
router.get('/purchase/received/vendors', purchase_controller_1.PurchaseOrderController.getVendorsFromReceivedOrders);
router.put('/purchase/item/:itemId', purchase_controller_1.PurchaseOrderController.updatePurchaseOrderItem);
router.get('/purchase/item/:itemId/receivals', purchase_controller_1.PurchaseOrderController.getReceivalHistory);
router.get('/purchase/:id', purchase_controller_1.PurchaseOrderController.getPurchaseOrderById);
router.put('/purchase/:id', purchase_controller_1.PurchaseOrderController.updatePurchaseOrder);
router.delete('/purchase/:id', purchase_controller_1.PurchaseOrderController.deletePurchaseOrder);
// Stock Entries
router.post('/stock', stock_controller_1.StockEntryController.createStockEntry);
router.get('/stock', stock_controller_1.StockEntryController.getStockEntries);
router.get('/stock/:id', stock_controller_1.StockEntryController.getStockEntryById);
router.put('/stock/:id', stock_controller_1.StockEntryController.updateStockEntry);
// Unfinished Stock
router.post('/unfinished', unfinished_controller_1.UnfinishedStockController.createUnfinishedStock);
router.get('/unfinished', unfinished_controller_1.UnfinishedStockController.getUnfinishedStocks);
router.get('/unfinished/:id', unfinished_controller_1.UnfinishedStockController.getUnfinishedStockById);
router.put('/unfinished/:id', unfinished_controller_1.UnfinishedStockController.updateUnfinishedStock);
// Vendors
router.post('/vendor', vendor_controller_1.VendorController.createVendor);
router.get('/vendor', vendor_controller_1.VendorController.getVendors);
router.get('/vendor/:id', vendor_controller_1.VendorController.getVendorById);
router.put('/vendor/:id', vendor_controller_1.VendorController.updateVendor);
router.patch('/vendor/:id/status', vendor_controller_1.VendorController.setVendorStatus);
// Warehouses
router.post('/warehouse', warehouse_controller_1.WarehouseController.createWarehouse);
router.get('/warehouse', warehouse_controller_1.WarehouseController.getWarehouses);
router.get('/warehouse/:id', warehouse_controller_1.WarehouseController.getWarehouseById);
router.put('/warehouse/:id', warehouse_controller_1.WarehouseController.updateWarehouse);
router.delete('/warehouse/:id', warehouse_controller_1.WarehouseController.deleteWarehouse);
// Locations
router.post('/location', location_controller_1.LocationController.createLocation);
router.get('/location', location_controller_1.LocationController.getLocations);
router.get('/location/:id', location_controller_1.LocationController.getLocationById);
router.put('/location/:id', location_controller_1.LocationController.updateLocation);
router.patch('/location/:id/status', location_controller_1.LocationController.setLocationStatus);
// Material Transfers
router.post('/transfers', transfer_controller_1.TransferController.createTransfer);
router.get('/transfers', transfer_controller_1.TransferController.getTransfers);
router.post('/transfers/outbound', transfer_controller_1.TransferController.createOutboundTransfer);
router.get('/transfers/sfg-warehouse-stock', transfer_controller_1.TransferController.getSfgWarehouseStock);
router.get('/transfers/outbound-stock-details', transfer_controller_1.TransferController.getOutboundStockDetails);
router.get('/transfers/packaging-stock', transfer_controller_1.TransferController.getPackagingStock);
router.get('/transfers/:id', transfer_controller_1.TransferController.getTransferById);
router.put('/transfers/:id/accept', transfer_controller_1.TransferController.acceptTransfer);
router.put('/transfers/:id/reject', transfer_controller_1.TransferController.rejectTransfer);
// Production Posting
router.get('/production/consumption-data', production_controller_1.ProductionController.getConsumptionData);
router.post('/production/post', production_controller_1.ProductionController.postProduction);
router.get('/production/postings', production_controller_1.ProductionController.getPostings);
router.get('/production/completed-for-outbound', production_controller_1.ProductionController.getCompletedForOutbound);
router.get('/production/postings/:id', production_controller_1.ProductionController.getPostingById);
router.put('/production/postings/:id/complete', production_controller_1.ProductionController.completeProduction);
router.get('/stock', stock_controller_1.StockEntryController.getCurrentStockDistribution);
router.get('/purchase-order-items', purchase_controller_1.PurchaseOrderController.getAllPurchaseOrderItems);
router.get('/transaction-logs', log_controller_1.TransactionLogController.getAllTransactionLogs);
router.get('/cleaned-materials', cleaning_controller_1.CleaningJobController.getCleanedMaterials);
router.get('/purchase', time_controller_1.getPurchaseOrdersByProduct);
router.get('/purchase/:id/timeline', time_controller_1.getPurchaseOrderTimeline);
router.get('/dashboard/total-stock', Dashboard_controller_1.DashboardController.getTotalRawMaterialStock);
router.get('/dashboard/pending-pos', Dashboard_controller_1.DashboardController.getPendingPOCount);
router.get('/dashboard/under-cleaning', Dashboard_controller_1.DashboardController.getStockUnderCleaning);
router.get('/dashboard/in-processing', Dashboard_controller_1.DashboardController.getStockInProcessing);
router.get('/dashboard/low-stock', Dashboard_controller_1.DashboardController.getLowStockAlerts);
router.get('/dashboard/waste-stock', Dashboard_controller_1.DashboardController.getWasteStock);
router.get('/dashboard/total-vendors', Dashboard_controller_1.DashboardController.getTotalVendors);
router.get('/dashboard/total-purchase-orders', Dashboard_controller_1.DashboardController.getTotalPurchaseOrders);
router.get('/dashboard/recent-transactions', Dashboard_controller_1.DashboardController.getRecentTransactions);
router.get('/dashboard/product-wise-waste', Dashboard_controller_1.DashboardController.getProductWiseWasteStock);
router.get('/dashboard/stock-distribution', Dashboard_controller_1.DashboardController.getStockDistributionByWarehouse);
router.get('/dashboard/product-wise-conversion', Dashboard_controller_1.DashboardController.getProductWiseConversionRatio);
// RM Quality Reports
router.post('/quality-report', quality_controller_1.RMQualityController.createQualityReport);
router.get('/quality-report', quality_controller_1.RMQualityController.getQualityReports);
router.get('/quality-report/without-grn', quality_controller_1.RMQualityController.getReportsWithoutGRN);
router.get('/quality-report/for-grn-page', quality_controller_1.RMQualityController.getReportsForGRNPage);
router.get('/quality-report/export/all', quality_controller_1.RMQualityController.exportAllQualityReports);
router.get('/quality-report/mail/all', qualityMail_controller_1.RMQualityMailController.mailAllQualityReports);
router.post('/quality-report/mail/filtered', qualityMailFiltered_controller_1.RMQualityMailFilteredController.mailFilteredQualityReports);
router.post('/quality-report/export/filtered', qualityExportFiltered_controller_1.RMQualityExportFilteredController.exportFilteredQualityReports);
router.get('/quality-report/:id', quality_controller_1.RMQualityController.getQualityReportById);
router.put('/quality-report/:id', quality_controller_1.RMQualityController.updateQualityReport);
router.delete('/quality-report/:id', quality_controller_1.RMQualityController.deleteQualityReport);
router.get('/quality-report/:id/export', quality_controller_1.RMQualityController.exportQualityReport);
// GRN by PO
router.post('/grn', grn_controller_1.GRNController.createGRN);
router.post('/grn/from-report', grn_controller_1.GRNController.generateGRNForReport);
router.get('/grn', grn_controller_1.GRNController.getGRNs);
router.get('/grn/received-pos', grn_controller_1.GRNController.getReceivedPOs);
router.get('/grn/po/:poId', grn_controller_1.GRNController.getGRNsByPO);
router.get('/grn/:id', grn_controller_1.GRNController.getGRNById);
router.delete('/grn/:id', grn_controller_1.GRNController.deleteGRN);
// GRN-wise Cleaning
router.get('/cleaning-grn', cleaningGrn_controller_1.CleaningGrnController.getGRNsForCleaning);
router.get('/cleaning-grn/lots', cleaningGrn_controller_1.CleaningGrnController.getCleaningLots);
router.get('/cleaning-grn/:grnNumber', cleaningGrn_controller_1.CleaningGrnController.getGRNMaterialsByGrnNumber);
router.post('/cleaning-grn/transfer', cleaningGrn_controller_1.CleaningGrnController.createGRNCleaningTransfer);
router.put('/cleaning-grn/finish/:id', cleaningGrn_controller_1.CleaningGrnController.finishCleaning);
// Bill of Material (BOM)
router.post('/bom', bom_controller_1.BOMController.createBOM);
router.get('/bom', bom_controller_1.BOMController.getBOMs);
router.get('/bom/by-sfg/:productId', bom_controller_1.BOMController.getBOMBySFG);
router.get('/bom/:id', bom_controller_1.BOMController.getBOMById);
router.put('/bom/:id', bom_controller_1.BOMController.updateBOM);
router.delete('/bom/:id', bom_controller_1.BOMController.deleteBOM);
// Grinding Dispatch (Transfer with Approval)
router.post('/grinding/dispatch', grindingDispatch_controller_1.GrindingDispatchController.createDispatch);
router.get('/grinding/dispatches', grindingDispatch_controller_1.GrindingDispatchController.getDispatches);
router.get('/grinding/dispatch/:id', grindingDispatch_controller_1.GrindingDispatchController.getDispatchById);
router.put('/grinding/dispatch/:id/accept', grindingDispatch_controller_1.GrindingDispatchController.acceptDispatch);
router.put('/grinding/dispatch/:id/reject', grindingDispatch_controller_1.GrindingDispatchController.rejectDispatch);
// FG Batch (Finished Good Batch Production)
router.get('/fg-batch/boms', fgBatch_controller_1.FGBatchController.getFGBOMs);
router.get('/fg-batch/bom-items', fgBatch_controller_1.FGBatchController.getFGBOMItems);
router.post('/fg-batch/create', fgBatch_controller_1.FGBatchController.createFGBatch);
router.get('/fg-batch/list', fgBatch_controller_1.FGBatchController.getFGBatches);
// FG Production Entry (Machine-wise Production) — must be before :id wildcard
router.get('/fg-batch/accepted-batches', fgProduction_controller_1.FGProductionController.getAcceptedBatches);
router.post('/fg-batch/production-entry', fgProduction_controller_1.FGProductionController.createProductionEntry);
router.get('/fg-batch/production-entries', fgProduction_controller_1.FGProductionController.getProductionEntries);
router.get('/fg-batch/production-entries/:id', fgProduction_controller_1.FGProductionController.getProductionEntryById);
router.post('/fg-batch/production-entries/:id/quality', fgProduction_controller_1.FGProductionController.submitQualityCheck);
router.put('/fg-batch/production-entries/:id/complete', fgProduction_controller_1.FGProductionController.submitProductionOutput);
// FG Batch by ID — :id wildcard must come last
router.get('/fg-batch/:id', fgBatch_controller_1.FGBatchController.getFGBatchById);
router.put('/fg-batch/:id/accept', fgBatch_controller_1.FGBatchController.acceptFGBatch);
router.put('/fg-batch/:id/reject', fgBatch_controller_1.FGBatchController.rejectFGBatch);
// FG Production Verification (Dispatch & Warehouse Accept/Reject)
router.post('/fg-verification/dispatch', fgVerification_controller_1.FGVerificationController.dispatchToWarehouse);
router.get('/fg-verification', fgVerification_controller_1.FGVerificationController.getVerifications);
router.put('/fg-verification/:id/accept', fgVerification_controller_1.FGVerificationController.acceptVerification);
router.put('/fg-verification/:id/reject', fgVerification_controller_1.FGVerificationController.rejectVerification);
// FG Packaging Master
router.get('/fg-packaging', fgPackaging_controller_1.FGPackagingController.getFGPackagingSettings);
router.get('/fg-packaging/product/:productId', fgPackaging_controller_1.FGPackagingController.getFGPackagingByProductId);
router.post('/fg-packaging', fgPackaging_controller_1.FGPackagingController.upsertFGPackagingSetting);
router.delete('/fg-packaging/:id', fgPackaging_controller_1.FGPackagingController.deleteFGPackagingSetting);
exports.default = router;
