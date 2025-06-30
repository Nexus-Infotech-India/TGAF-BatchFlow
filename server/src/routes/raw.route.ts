import { Router } from 'express';
import { CleaningJobController } from '../controllers/rawmaterial/cleaning.controller';
import { ProcessingJobController } from '../controllers/rawmaterial/processing.controller';
import { RawMaterialProductController } from '../controllers/rawmaterial/product.controller';
import { PurchaseOrderController } from '../controllers/rawmaterial/purchase.controller';
import { StockEntryController } from '../controllers/rawmaterial/stock.controller';
import { UnfinishedStockController } from '../controllers/rawmaterial/unfinished.controller';
import { VendorController } from '../controllers/rawmaterial/vendor.controller';
import { WarehouseController } from '../controllers/rawmaterial/warehouse.controller';

const router = Router();

// Cleaning Jobs
router.post('/cleaning', CleaningJobController.createCleaningJob);
router.get('/cleaning', CleaningJobController.getCleaningJobs);
router.get('/cleaning/:id', CleaningJobController.getCleaningJobById);
router.put('/cleaning/:id', CleaningJobController.updateCleaningJob);

// Processing Jobs
router.post('/processing', ProcessingJobController.createProcessingJob);
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
router.get('/purchase/:id', PurchaseOrderController.getPurchaseOrderById);
router.put('/purchase/:id', PurchaseOrderController.updatePurchaseOrder);
router.put('/purchase/item/:itemId', PurchaseOrderController.updatePurchaseOrderItem);

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

router.get('/stock', StockEntryController.getCurrentStockDistribution);;

export default router;