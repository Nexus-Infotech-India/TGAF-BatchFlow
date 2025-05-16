import { PrismaClient } from '../generated/prisma';


const prisma = new PrismaClient();

/**
 * Standalone script to reset all database data including user-related data
 */
async function resetDatabase(): Promise<void> {
  try {
    console.log('Starting complete database reset operation (including user data)');

    // First disconnect many-to-many relationships to avoid foreign key errors
    console.log('Disconnecting relationships...');
    
    try {
      // First find all batches to update their relationships
      const batches = await prisma.batch.findMany({
        select: { id: true }
      });
      
      // Update each batch to remove relationships
      for (const batch of batches) {
        await prisma.batch.update({
          where: { id: batch.id },
          data: {
            checkerId: null,
            standards: { set: [] },
            methodologies: { set: [] },
            unitOfMeasurements: { set: [] }
          }
        });
      }
      
      // Find all standards to update their relationships
      const standards = await prisma.standard.findMany({
        select: { id: true }
      });
      
      // Update each standard to remove relationships
      for (const standard of standards) {
        await prisma.standard.update({
          where: { id: standard.id },
          data: {
            methodologies: { set: [] },
            units: { set: [] }
          }
        });
      }

      // Clear user roles relationship
      const users = await prisma.user.findMany({
        select: { id: true }
      });
      
      for (const user of users) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            // Role: { set: [] }
          }
        });
      }
    } catch (error) {
      console.log('Some tables might not exist yet, continuing with cleanup...');
    }
    
    console.log('Deleting records from tables...');
    
    // Delete data in proper order to respect foreign key constraints
    await prisma.batchParameterValue.deleteMany().catch(() => console.log('No BatchParameterValue records to delete'));
    await prisma.notification.deleteMany().catch(() => console.log('No Notification records to delete'));
    await prisma.activityLog.deleteMany().catch(() => console.log('No ActivityLog records to delete'));
    await prisma.batch.deleteMany().catch(() => console.log('No Batch records to delete'));
    await prisma.standardDefinition.deleteMany().catch(() => console.log('No StandardDefinition records to delete'));
    await prisma.standardParameter.deleteMany().catch(() => console.log('No StandardParameter records to delete'));
    await prisma.standard.deleteMany().catch(() => console.log('No Standard records to delete'));
    await prisma.standardCategory.deleteMany().catch(() => console.log('No StandardCategory records to delete'));
    await prisma.methodology.deleteMany().catch(() => console.log('No Methodology records to delete'));
    await prisma.unitOfMeasurement.deleteMany().catch(() => console.log('No UnitOfMeasurement records to delete'));
    await prisma.product.deleteMany().catch(() => console.log('No Product records to delete'));
    await prisma.exportLog.deleteMany().catch(() => console.log('No ExportLog records to delete'));
    
    // Delete user-related data
    //await prisma.session?.deleteMany().catch(() => console.log('No Session records to delete'));
    await prisma.role.deleteMany().catch(() => console.log('No Role records to delete'));
    await prisma.user.deleteMany().catch(() => console.log('No User records to delete'));
    
    console.log('Resetting auto-increment sequences (if applicable)...');
    
    // PostgreSQL uses sequences for auto-incrementing fields
    // Reset any sequences that might be used (adjust based on your actual table names/sequences)
    try {
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "BatchParameterValue_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Batch_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "StandardDefinition_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "StandardParameter_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Standard_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "StandardCategory_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Methodology_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "UnitOfMeasurement_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Product_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "ExportLog_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Session_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Role_id_seq" RESTART WITH 1`);
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`);
    } catch (seqError) {
      console.log('Note: Some sequences might not exist or auto-increment might be handled differently');
      if (seqError instanceof Error) {
        console.log('Sequence reset error (non-critical):', seqError.message);
      } else {
        console.log('Sequence reset error (non-critical):', seqError);
      }
    }
    
    console.log('Complete database reset completed successfully (including user data)');
  } catch (error) {
    console.error('Error resetting database:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function when this file is run directly
resetDatabase()
  .then(() => {
    console.log('Script execution complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });