# RECREATION GUIDE - Purchase Order Receiving System

## ⚠️ CURRENT STATE: BROKEN
All files currently have **git merge conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`) throughout them from a bad git stash pop/merge. The following files need to be recreated or have conflicts resolved:

1. `server/prisma/schema.prisma` - has merge conflicts in the generator block AND in the PurchaseOrderItem model
2. `server/src/controllers/rawmaterial/purchase.controller.ts` - has merge conflicts throughout the `updatePurchaseOrderItem` method  
3. `client/src/components/ui/Order/statusModal.tsx` - **FILE IS EMPTY** (was accidentally deleted, needs full recreation)
4. `client/src/components/pages/Order/PurchaseOrder.tsx` - **FILE IS EMPTY** (was accidentally deleted, needs full recreation)

---

## OVERVIEW OF THE SYSTEM

This is a **Purchase Order Receiving System** for the TGAF-BatchFlow application. It allows users to:
- Create purchase orders with items (raw materials)
- Receive items partially or fully, recording weight via individual bags or total weight
- Track receival history per item
- Auto-determine item status based on total received vs ordered quantity
- Update current stock and stock entries upon receiving

The tech stack is:
- **Backend**: Express.js + TypeScript + Prisma ORM + PostgreSQL (hosted on Neon)
- **Frontend**: React + TypeScript + Tailwind-like utility classes (custom CSS variables) + Framer Motion

---

## FILE 1: `server/prisma/schema.prisma`

### What needs to be fixed:
Remove ALL merge conflict markers. The correct version of the conflicted sections should be:

### Section 1: Generator block (around line 14-29)
Remove the conflict markers and keep this clean version:
```prisma
generator erd {
  provider = "prisma-erd-generator"
}
```

### Section 2: PurchaseOrderItem model (around line 956-1007)
The correct version uses the **NEW schema** with enum status, totalReceived, and receivals relation. Remove the old version with `quantityReceived`, `status String`, and the GRN models. The correct model is:

```prisma
enum PurchaseOrderItemStatus {
  PENDING
  PARTIALLY_RECEIVED
  RECEIVED
}

model PurchaseOrderItem {
  id              String                  @id @default(uuid())
  purchaseOrderId String
  purchaseOrder   PurchaseOrder           @relation(fields: [purchaseOrderId], references: [id])
  rawMaterialId   String
  rawMaterial     RawMaterialProduct      @relation(fields: [rawMaterialId], references: [id])
  quantityOrdered Float
  rate            Float
  totalReceived   Float                   @default(0)
  status          PurchaseOrderItemStatus @default(PENDING)
  receivals       ReceivalEntry[]
}
```

**DO NOT** include the old GRN model, GRNBagWeight model, or quantityReceived field.

### Section 3: These models should exist AFTER PurchaseOrderItem:
```prisma
model ReceivalEntry {
  id                  String            @id @default(uuid())
  purchaseOrderItemId String
  purchaseOrderItem   PurchaseOrderItem @relation(fields: [purchaseOrderItemId], references: [id])
  warehouseId         String
  warehouse           Warehouse         @relation(fields: [warehouseId], references: [id])
  weightMode          WeightMode        @default(INDIVIDUAL)
  totalWeight         Float // total weight received in this receival
  bags                ReceivalBag[]
  notes               String?
  receivedDate        DateTime          @default(now())
}

enum WeightMode {
  INDIVIDUAL
  TOTAL
}

model ReceivalBag {
  id              String        @id @default(uuid())
  receivalEntryId String
  receivalEntry   ReceivalEntry @relation(fields: [receivalEntryId], references: [id], onDelete: Cascade)
  bagNo           Int
  bagWeight       Float
}
```

### Important: The Warehouse model needs these relations:
```prisma
model Warehouse {
  // ... existing fields ...
  currentStocks    CurrentStock[]
  receivalEntries  ReceivalEntry[]
  // ... other existing relations ...
}
```

---

## FILE 2: `server/src/controllers/rawmaterial/purchase.controller.ts`

### What needs to be done:
Remove ALL merge conflict markers and use the **NEW version** of the `updatePurchaseOrderItem` method. The old version used `quantityReceived` and `status` (string). The new version uses the receival-based system.

### The CORRECT `updatePurchaseOrderItem` method should be:

```typescript
// Receive items for a purchase order item (partial or full)
static async updatePurchaseOrderItem(req: Request, res: Response): Promise<void> {
  try {
    const { itemId } = req.params;
    const {
      status,         // 'PARTIALLY_RECEIVED' or 'RECEIVED' (ignored - auto-determined)
      warehouseId,
      weightMode,     // 'INDIVIDUAL' or 'TOTAL'
      bags,           // [{ bagNo, bagWeight }] - used when weightMode is INDIVIDUAL
      totalWeight,    // used when weightMode is TOTAL
      numberOfBags,   // used when weightMode is TOTAL (optional)
      notes,
    } = req.body;

    // 1. Fetch the current item with its receivals
    const item = await prisma.purchaseOrderItem.findUnique({
      where: { id: itemId },
      include: {
        receivals: true,
        rawMaterial: true,
        purchaseOrder: true,
      },
    });

    if (!item) {
      res.status(404).json({ error: 'Purchase order item not found' });
      return;
    }

    // 2. If already RECEIVED, block further receiving
    if (item.status === 'RECEIVED') {
      res.status(400).json({
        error: 'This item has already been fully received. No further receiving is allowed.',
      });
      return;
    }

    if (!warehouseId) {
      res.status(400).json({ error: 'warehouseId is required' });
      return;
    }

    // 3. Calculate weight for this receival
    let receivalWeight = 0;
    let bagData: { bagNo: number; bagWeight: number }[] = [];

    if (weightMode === 'INDIVIDUAL') {
      if (!bags || !Array.isArray(bags) || bags.length === 0) {
        res.status(400).json({ error: 'bags array is required for INDIVIDUAL weight mode' });
        return;
      }
      receivalWeight = bags.reduce((sum: number, b: any) => sum + (b.bagWeight || 0), 0);
      bagData = bags.map((b: any, idx: number) => ({
        bagNo: b.bagNo || idx + 1,
        bagWeight: b.bagWeight,
      }));
    } else {
      // TOTAL weight mode
      if (!totalWeight || totalWeight <= 0) {
        res.status(400).json({ error: 'totalWeight is required for TOTAL weight mode' });
        return;
      }
      receivalWeight = totalWeight;
      // Optionally split into equal bags
      if (numberOfBags && numberOfBags > 0) {
        const weightPerBag = totalWeight / numberOfBags;
        bagData = Array.from({ length: numberOfBags }, (_, i) => ({
          bagNo: i + 1,
          bagWeight: parseFloat(weightPerBag.toFixed(2)),
        }));
      }
    }

    const newTotalReceived = item.totalReceived + receivalWeight;

    // 4. Determine the final status based on quantity comparison
    let finalStatus: string;
    if (newTotalReceived >= item.quantityOrdered) {
      // Received quantity meets or exceeds ordered → automatically fully received
      finalStatus = 'RECEIVED';
    } else if (newTotalReceived > 0) {
      // Some received but not all → partially received
      finalStatus = 'PARTIALLY_RECEIVED';
    } else {
      finalStatus = 'PENDING';
    }

    // 5. Create the receival entry in a transaction (30s timeout for remote DB on Neon)
    const result = await prisma.$transaction(async (tx) => {
      // Create ReceivalEntry with bags
      const receivalEntry = await tx.receivalEntry.create({
        data: {
          purchaseOrderItemId: itemId,
          warehouseId,
          weightMode: weightMode === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'TOTAL',
          totalWeight: receivalWeight,
          notes,
          bags: bagData.length > 0
            ? { create: bagData }
            : undefined,
        },
        include: { bags: true, warehouse: true },
      });

      // Update the PO item
      const updatedItem = await tx.purchaseOrderItem.update({
        where: { id: itemId },
        data: {
          totalReceived: newTotalReceived,
          status: finalStatus as any,
        },
        include: {
          rawMaterial: true,
          purchaseOrder: true,
          receivals: {
            include: { bags: true, warehouse: true },
            orderBy: { receivedDate: 'desc' },
          },
        },
      });

      // Update current stock
      const currentStock = await tx.currentStock.findUnique({
        where: {
          rawMaterialId_warehouseId: {
            rawMaterialId: item.rawMaterialId,
            warehouseId,
          },
        },
      });

      if (currentStock) {
        await tx.currentStock.update({
          where: {
            rawMaterialId_warehouseId: {
              rawMaterialId: item.rawMaterialId,
              warehouseId,
            },
          },
          data: {
            currentQuantity: { increment: receivalWeight },
          },
        });
      } else {
        await tx.currentStock.create({
          data: {
            rawMaterialId: item.rawMaterialId,
            warehouseId,
            currentQuantity: receivalWeight,
          },
        });
      }

      // Create a stock entry for traceability
      await tx.stockEntry.create({
        data: {
          rawMaterialId: item.rawMaterialId,
          warehouseId,
          quantity: receivalWeight,
          entryType: 'IN',
          referenceId: receivalEntry.id,
          status: 'Received',
        },
      });

      // Transaction log (non-blocking: don't fail the whole receival if logging fails)
      if (req.user?.id) {
        try {
          await tx.transactionLog.create({
            data: {
              type: 'RECEIVE',
              entity: 'PurchaseOrderItem',
              entityId: item.id,
              userId: req.user.id,
              description: `Received ${receivalWeight} for PO: ${item.purchaseOrder.poNumber}, Material: ${item.rawMaterial.name}. Status: ${finalStatus}. Mode: ${weightMode}`,
            },
          });
        } catch (logError) {
          console.warn('Failed to create transaction log:', logError);
        }
      }

      return updatedItem;
    }, { timeout: 30000, maxWait: 10000 });

    res.json(result);
  } catch (error: any) {
    console.error('Error receiving purchase order item:', error);
    res.status(500).json({
      error: 'Failed to receive purchase order item',
      message: error?.message || 'Unknown error',
      code: error?.code,
    });
  }
}
```

### Key design decisions in the controller:
1. **Transaction timeout**: Set to 30s because DB is on Neon (remote PostgreSQL), and the default 5s is too short for 5-6 sequential queries over the network
2. **Auto-status determination**: Status is determined by `newTotalReceived >= quantityOrdered`, NOT by user selection
3. **Non-blocking transaction log**: Wrapped in try-catch so a FK violation on userId doesn't crash the entire receival. Only creates the log if `req.user?.id` exists (no more `'system'` fallback that would violate FK constraint)
4. **Stock entry referenceId**: Points to `receivalEntry.id` (not `itemId`) for proper traceability

### The `getPurchaseOrders` method should include auto-correction logic:
After fetching purchase orders, add this block before `res.json(purchaseOrders)`:

```typescript
// Auto-correct stale statuses (e.g. items with totalReceived >= quantityOrdered still showing PARTIALLY_RECEIVED)
const corrections: Promise<any>[] = [];
for (const po of purchaseOrders) {
  for (const item of po.items) {
    let correctStatus: string | null = null;
    if (item.totalReceived >= item.quantityOrdered && item.status !== 'RECEIVED') {
      correctStatus = 'RECEIVED';
    } else if (item.totalReceived > 0 && item.totalReceived < item.quantityOrdered && item.status === 'PENDING') {
      correctStatus = 'PARTIALLY_RECEIVED';
    }
    if (correctStatus) {
      (item as any).status = correctStatus;
      corrections.push(
        prisma.purchaseOrderItem.update({
          where: { id: item.id },
          data: { status: correctStatus as any },
        })
      );
    }
  }
}
if (corrections.length > 0) {
  await Promise.all(corrections).catch(() => {});
}
```

### Other methods that should exist in the controller (keep as-is, no conflicts):
- `createPurchaseOrder` - creates PO with items
- `getPurchaseOrders` - lists all POs with items, receivals, bags, warehouse
- `getPurchaseOrderById` - single PO by ID
- `updatePurchaseOrder` - update PO status/expectedDate
- `getReceivalHistory` - get receivals for a specific item
- `getAllPurchaseOrderItems` - get all current stock
- `getReceivedRawMaterials` - unique raw materials that have been received
- `getVendorsFromReceivedOrders` - unique vendors from received orders
- `deletePurchaseOrder` - delete PO (only if no receivals exist)

---

## FILE 3: `client/src/components/ui/Order/statusModal.tsx` (NEEDS FULL RECREATION)

This file was completely deleted. It needs to be recreated with these components:

### Component 1: `ReceiveModal` (default export)
- **Props**: `open`, `onClose`, `onConfirm`, `defaultQuantity`, `currentReceived`, `currentStatus`, `itemId`, `receivals`
- **Features**:
  - Shows header with Ordered / Received / Remaining stats
  - If `currentStatus === 'RECEIVED'`, shows a read-only "Fully Received" view with receival history and a Close button
  - Otherwise shows a form with:
    - **Receival history toggle** (collapsible previous receivals list)
    - **Auto-status info box**: Explains that status is auto-determined. If `remaining <= 0`, says "already fully received". Otherwise says "If total received reaches {ordered}, item will be marked as Fully Received."
    - **Warehouse selection**: Dropdown of warehouses fetched from `API_ROUTES.RAW.GET_WAREHOUSES`, plus a "+" button to add a new warehouse (shows inline `WarehouseForm`)
    - **Weight Entry Mode toggle**: Two buttons - "Total Weight" (Scale icon) and "Individual Bags" (Hash icon)
    - **Total Weight mode**: Input for total weight + optional number of bags for splitting
    - **Individual Bags mode**: Dynamic list of bags with weight inputs, add/remove buttons, running total
    - **Notes textarea** (optional)
    - **Confirm/Cancel buttons**
  - `onConfirm` sends: `{ status, warehouseId, weightMode, bags?, totalWeight?, numberOfBags?, notes? }`
  - Uses icons from `lucide-react`: `Package, Scale, Hash, Plus, Trash2, ChevronDown, ChevronUp`

### Component 2: `ReceivalHistory` (internal, not exported)
- Shows a list of past receivals with:
  - Total weight, date
  - Warehouse name, weight mode
  - Bag count
  - Notes

### Component 3: `WarehouseForm` (internal, not exported)
- Simple form to create a new warehouse (name + location)
- Posts to `API_ROUTES.RAW.CREATE_WAREHOUSE`
- Calls `onCreated(warehouse)` callback

### Component 4: `EditOrderModal` (named export)
- Simple modal with a date input for `expectedDate`
- Props: `open`, `onClose`, `onSave`, `defaultExpectedDate`

### Component 5: `DeleteOrderModal` (named export)
- Confirmation modal for deleting a purchase order
- Shows PO number, asks for confirmation
- Props: `open`, `onClose`, `onDelete`, `poNumber`

### Styling pattern:
- Uses CSS variable-based classes: `bg-card`, `border-border/30`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `bg-muted/20`, etc.
- Modal backdrop: `fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm`
- Card: `bg-card border border-border/30 rounded-xl shadow-2xl`
- No hardcoded dark gradients (theme-agnostic)

---

## FILE 4: `client/src/components/pages/Order/PurchaseOrder.tsx` (NEEDS FULL RECREATION)

This file was completely deleted. It needs to be recreated:

### Component: `PurchaseOrderList` (default export)
- **State**: `orders`, `loading`, `showReceiveModal`, `receiveItem`, `editModalOpen`, `deleteModalOpen`, `selectedOrder`, `sendingMailForOrder`, `expandedRows`
- **API calls**:
  - `fetchOrders()` → `GET API_ROUTES.RAW.GET_PURCHASE_ORDERS`
  - `handleEditSave()` → `PUT API_ROUTES.RAW.UPDATE_PURCHASE_ORDER(selectedOrder.id)`
  - `handleDeleteConfirm()` → `DELETE API_ROUTES.RAW.DELETE_PURCHASE_ORDER(selectedOrder.id)`
  - `handleReceiveConfirm()` → `PUT API_ROUTES.RAW.UPDATE_PURCHASE_ORDER_ITEM(receiveItem.id)`
  - `handleSendMail()` → `GET API_ROUTES.RAW.SEND_PRODUCT_MAIL`
- **Layout**:
  1. **Header**: Title "Purchase Orders" with Package icon, "Send All via Email" button, "+ Create Order" button (navigates to `/raw/purchase-order`)
  2. **Stats Bar**: 4 cards showing Total Orders, Fully Received, Partially Received, Pending counts
  3. **Table**: Columns - PO Number, Vendor, SKU Code, Product Name, Order Date, Expected Date, Ordered, Received (with progress bar), Rate, Status, Actions
     - PO Number and Vendor are `rowSpan`-ed across items in the same order
     - Received column shows a progress bar (green if >=100%, amber otherwise)
     - Status shows a badge with icon
     - Actions column:
       - **Receive button**: Disabled if `status === 'RECEIVED'` (shows "Received"), shows "Add More" if `PARTIALLY_RECEIVED`, shows "Receive" if `PENDING`
       - **Eye/ChevronUp button**: Toggles expanded receival history row
  4. **Expanded Row**: Shows receival history with weight, date, warehouse, weight mode, bag list, notes
  5. **Modals**: ReceiveModal, EditOrderModal, DeleteOrderModal

### Types used:
```typescript
type Vendor = { id: string; name: string };
type ReceivalBag = { bagNo: number; bagWeight: number };
type ReceivalEntry = {
  id: string;
  warehouseId: string;
  warehouse: { name: string };
  weightMode: 'INDIVIDUAL' | 'TOTAL';
  totalWeight: number;
  bags: ReceivalBag[];
  notes?: string;
  receivedDate: string;
};
type PurchaseOrderItem = {
  id: string;
  rawMaterialId: string;
  quantityOrdered: number;
  totalReceived: number;
  rate: number;
  status: string;
  rawMaterial?: { id: string; skuCode: string; name: string };
  receivals?: ReceivalEntry[];
};
type PurchaseOrder = {
  id: string;
  poNumber: string;
  vendor: Vendor;
  orderDate: string;
  expectedDate: string;
  status: string;
  items: PurchaseOrderItem[];
};
```

### Helper functions:
- `formatDate(dateString)` - returns `new Date(dateString).toLocaleDateString()` or 'N/A'
- `getStatusConfig(status)` - returns `{ label, icon, classes }` for RECEIVED (green), PARTIALLY_RECEIVED (amber), PENDING (muted)

### Imports:
```typescript
import React, { useEffect, useState } from 'react';
import api, { API_ROUTES } from '../../../utils/api';
import { CheckCircle, XCircle, Clock, FileText, TrendingUp, Package, Hash, Calendar as CalendarIcon, User2, Boxes, Mail, AlertCircle, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import ReceiveModal, { DeleteOrderModal, EditOrderModal } from '../../ui/Order/statusModal';
import { useNavigate } from 'react-router-dom';
```

### Styling pattern:
- Uses Framer Motion `motion.div`, `motion.tr`, `motion.button` with `whileHover`, `whileTap`, `initial`, `animate`
- Stats cards have subtle gradient: `linear-gradient(90deg, rgba(83, 23, 170, 0.03) 0%, rgba(83, 23, 170, 0.01) 50%, transparent 100%)`
- Table has same gradient style
- Rate column displays with ₦ prefix: `₦{item.rate.toLocaleString()}`

---

## FILE 5: `server/src/routes/raw.route.ts`

### Route order matters! The correct order for purchase routes is:
```typescript
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
```

**IMPORTANT**: Static routes like `/purchase/received/raw-materials`, `/purchase/send-mail`, and `/purchase/item/:itemId` MUST come BEFORE dynamic routes like `/purchase/:id`, otherwise Express will match `:id` param for those paths.

---

## FILE 6: `server/src/controllers/rawmaterial/Dashboard.controller.ts`

### One small fix needed:
In the `getPendingPOCount` method (around line 31), the status filter should use the enum value:
```typescript
status: { not: 'RECEIVED' },
```
This is already correct in the current file. Just make sure it's `'RECEIVED'` (uppercase enum), NOT `'Received'` (old string).

---

## FILE 7: `server/src/controllers/auth.controller.ts`

### This file has TypeScript errors (TS7006: implicit 'any' type)
These are NOT related to the PO system but will prevent the server from starting. The fix is to add explicit type annotations to all `.map()` and `.reduce()` callbacks. The affected lines are:

- Line 218: `p => ({` → `(p: any) => ({`
- Line 225: `log => ({` → `(log: any) => ({`
- Line 232: `notification => ({` → `(notification: any) => ({`
- Line 239: `batch => ({` → `(batch: any) => ({`
- Line 246: `batch => ({` → `(batch: any) => ({`
- Line 253: `standard => ({` → `(standard: any) => ({`
- Line 363: `user => ({` → `(user: any) => ({`
- Line 610: `(acc, permission) => {` → `(acc: any, permission: any) => {`
- Line 764: `role => ({` → `(role: any) => ({`
- Line 820: `permission => {` → `(permission: any) => {`

---

## API ROUTES (client/src/utils/api.ts)

The relevant routes that should exist:
```typescript
// Purchase Orders
CREATE_PURCHASE_ORDER: `${BASE_URL}/raw/purchase`,
GET_PURCHASE_ORDERS: `${BASE_URL}/raw/purchase`,
SEND_PRODUCT_MAIL: `${BASE_URL}/raw/purchase/send-mail`,
GET_PURCHASE_ORDER_BY_ID: (id: string) => `${BASE_URL}/raw/purchase/${id}`,
UPDATE_PURCHASE_ORDER: (id: string) => `${BASE_URL}/raw/purchase/${id}`,
GET_RECEIVED_RAW_MATERIALS: `${BASE_URL}/raw/purchase/received/raw-materials`,
GET_RECEIVED_VENDORS: `${BASE_URL}/raw/purchase/received/vendors`,
UPDATE_PURCHASE_ORDER_ITEM: (itemId: string) => `${BASE_URL}/raw/purchase/item/${itemId}`,
GET_RECEIVAL_HISTORY: (itemId: string) => `${BASE_URL}/raw/purchase/item/${itemId}/receivals`,
DELETE_PURCHASE_ORDER: (id: string) => `${BASE_URL}/raw/purchase/${id}`,
```

---

## SUMMARY OF KEY DESIGN DECISIONS

1. **Status is auto-determined**: When receiving, the backend calculates `newTotalReceived` and sets status automatically. If `newTotalReceived >= quantityOrdered` → RECEIVED. If `> 0 && < ordered` → PARTIALLY_RECEIVED. The frontend does NOT allow manual status selection.

2. **Once RECEIVED, no more receiving**: Both backend (400 error) and frontend (disabled button + read-only modal) enforce this.

3. **Transaction timeout 30s**: Required for Neon-hosted PostgreSQL. Default 5s causes P2028 "Transaction already closed" errors.

4. **Non-blocking transaction log**: Wrapped in try-catch so FK violation on `userId` doesn't crash receiving. Only creates log if `req.user?.id` is available.

5. **Auto-correction on fetch**: When PO list is fetched, items with mismatched status are corrected in the background.

6. **Weight modes**: INDIVIDUAL (per-bag weights) or TOTAL (single weight, optionally split into equal bags).
